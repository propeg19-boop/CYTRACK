import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from './supabase';
import { useAuth } from './AuthContext';
import { DailyLog, FlowLevel, MoodType, Symptom } from './types';
import { formatDateString } from './cycleStats';

const LOCAL_DAILY_LOGS_KEY = 'cytrack_demo_daily_logs';

export const DEFAULT_SYMPTOMS: Symptom[] = [
  { id: 'cramps', name: 'Cramps', category: 'physical', icon_name: 'Zap', sort_order: 1 },
  { id: 'headache', name: 'Headache', category: 'physical', icon_name: 'Brain', sort_order: 2 },
  { id: 'bloating', name: 'Bloating', category: 'digestive', icon_name: 'Wind', sort_order: 3 },
  { id: 'fatigue', name: 'Fatigue', category: 'energy', icon_name: 'BatteryLow', sort_order: 4 },
  { id: 'back_pain', name: 'Back Pain', category: 'physical', icon_name: 'Activity', sort_order: 5 },
  { id: 'breast_tenderness', name: 'Breast Tenderness', category: 'physical', icon_name: 'Heart', sort_order: 6 },
  { id: 'acne', name: 'Acne / Skin', category: 'physical', icon_name: 'Sparkles', sort_order: 7 },
  { id: 'nausea', name: 'Nausea', category: 'digestive', icon_name: 'AlertCircle', sort_order: 8 },
  { id: 'cravings', name: 'Cravings', category: 'digestive', icon_name: 'Coffee', sort_order: 9 },
  { id: 'mood_swings', name: 'Mood Swings', category: 'emotional', icon_name: 'Smile', sort_order: 10 },
  { id: 'anxiety', name: 'Anxiety', category: 'emotional', icon_name: 'ShieldAlert', sort_order: 11 },
  { id: 'insomnia', name: 'Insomnia', category: 'energy', icon_name: 'Moon', sort_order: 12 },
];

export function useDailyLog(selectedDate: string = formatDateString(new Date())) {
  const { user, isDemoMode } = useAuth();
  const [log, setLog] = useState<DailyLog | null>(null);
  const [symptomsList] = useState<Symptom[]>(DEFAULT_SYMPTOMS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allLogs, setAllLogs] = useState<DailyLog[]>([]);

  const fetchLogs = useCallback(async () => {
    if (!user) {
      setLog(null);
      setAllLogs([]);
      setLoading(false);
      return;
    }

    if (isDemoMode || !isSupabaseConfigured) {
      const stored = localStorage.getItem(LOCAL_DAILY_LOGS_KEY);
      const logs: DailyLog[] = stored ? JSON.parse(stored) : [];
      setAllLogs(logs);
      const match = logs.find(l => l.log_date === selectedDate);
      setLog(match || null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data: logsData, error: logsErr } = await supabase
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

      if (logsErr) throw logsErr;

      const formattedLogs: DailyLog[] = (logsData || []).map((row: any) => ({
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

      setAllLogs(formattedLogs);
      const current = formattedLogs.find(l => l.log_date === selectedDate);
      setLog(current || null);
    } catch (err) {
      console.error('Error fetching daily logs:', err);
    } finally {
      setLoading(false);
    }
  }, [user, isDemoMode, selectedDate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const saveLog = async (data: {
    flow?: FlowLevel | null;
    mood?: MoodType | null;
    energy?: number | null;
    notes?: string | null;
    symptoms?: string[];
  }) => {
    if (!user) return;
    setSaving(true);

    if (isDemoMode || !isSupabaseConfigured) {
      const stored = localStorage.getItem(LOCAL_DAILY_LOGS_KEY);
      const logs: DailyLog[] = stored ? JSON.parse(stored) : [];
      const existingIdx = logs.findIndex(l => l.log_date === selectedDate);

      const updatedLog: DailyLog = {
        id: existingIdx >= 0 ? logs[existingIdx].id : 'log-' + Date.now(),
        user_id: user.id,
        log_date: selectedDate,
        flow: data.flow,
        mood: data.mood,
        energy: data.energy,
        notes: data.notes,
        symptoms: data.symptoms || [],
        created_at: existingIdx >= 0 ? logs[existingIdx].created_at : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      let newLogsList: DailyLog[];
      if (existingIdx >= 0) {
        newLogsList = [...logs];
        newLogsList[existingIdx] = updatedLog;
      } else {
        newLogsList = [updatedLog, ...logs];
      }

      localStorage.setItem(LOCAL_DAILY_LOGS_KEY, JSON.stringify(newLogsList));
      setLog(updatedLog);
      setAllLogs(newLogsList);
      setSaving(false);
      return;
    }

    try {
      const { data: upsertedLog, error: upsertErr } = await supabase
        .from('daily_logs')
        .upsert(
          {
            user_id: user.id,
            log_date: selectedDate,
            flow: data.flow,
            mood: data.mood,
            energy: data.energy,
            notes: data.notes,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,log_date' }
        )
        .select()
        .single();

      if (upsertErr) throw upsertErr;

      if (upsertedLog && data.symptoms !== undefined) {
        await supabase.from('daily_symptoms').delete().eq('daily_log_id', upsertedLog.id);

        if (data.symptoms.length > 0) {
          const symptomInserts = data.symptoms.map(symId => ({
            daily_log_id: upsertedLog.id,
            symptom_id: symId,
          }));
          await supabase.from('daily_symptoms').insert(symptomInserts);
        }
      }

      await fetchLogs();
    } catch (err: any) {
      console.error('Error saving daily log:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  return {
    log,
    allLogs,
    symptomsList,
    loading,
    saving,
    saveLog,
    refetch: fetchLogs,
  };
}
