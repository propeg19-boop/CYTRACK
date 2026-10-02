import { supabase, isSupabaseConfigured } from './supabase';
import { UserProfile, Cycle, DailyLog } from './types';

export async function exportUserData(user: { id: string; email?: string | null }) {
  let profileData: Partial<UserProfile> | null = null;
  let cyclesData: Cycle[] = [];
  let dailyLogsData: DailyLog[] = [];

  if (!isSupabaseConfigured) {
    const p = localStorage.getItem('cytrack_demo_profile');
    if (p) profileData = JSON.parse(p);
    const c = localStorage.getItem('cytrack_demo_cycles');
    if (c) cyclesData = JSON.parse(c);
    const l = localStorage.getItem('cytrack_demo_daily_logs');
    if (l) dailyLogsData = JSON.parse(l);
  } else {
    // 1. Fetch Profile
    const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    profileData = p;

    // 2. Fetch Cycles
    const { data: c } = await supabase.from('cycles').select('*').eq('user_id', user.id).order('start_date', { ascending: false });
    cyclesData = (c as Cycle[]) || [];

    // 3. Fetch Daily Logs with Symptoms
    const { data: l } = await supabase
      .from('daily_logs')
      .select(`
        id,
        user_id,
        log_date,
        flow,
        mood,
        energy,
        notes,
        created_at,
        updated_at,
        daily_symptoms(symptom_id)
      `)
      .eq('user_id', user.id)
      .order('log_date', { ascending: false });

    dailyLogsData = (l || []).map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      log_date: row.log_date,
      flow: row.flow,
      mood: row.mood,
      energy: row.energy,
      notes: row.notes,
      symptoms: row.daily_symptoms?.map((ds: any) => ds.symptom_id) || [],
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
  }

  const exportPayload = {
    app: 'CYTRACK',
    version: '1.0.0',
    export_date: new Date().toISOString(),
    user: {
      id: user.id,
      email: user.email || null,
    },
    profile: profileData,
    cycles: cyclesData,
    daily_logs: dailyLogsData,
  };

  // Trigger file download in browser
  const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cytrack-export-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
