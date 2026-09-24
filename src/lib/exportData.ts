import { supabase } from './supabase'

export async function exportUserData(): Promise<void> {
  const [cyclesRes, logsRes] = await Promise.all([
    supabase.from('cycles').select('start_date, end_date').order('start_date', { ascending: true }),
    supabase
      .from('daily_logs')
      .select('log_date, mood, energy, flow, notes, daily_symptoms(symptom:symptoms(name))')
      .order('log_date', { ascending: true }),
  ])

  if (cyclesRes.error) throw cyclesRes.error
  if (logsRes.error) throw logsRes.error

  const logs = (logsRes.data ?? []).map((row: any) => ({
    log_date: row.log_date,
    mood: row.mood,
    energy: row.energy,
    flow: row.flow,
    notes: row.notes,
    symptoms: (row.daily_symptoms ?? []).map((ds: any) => ds.symptom?.name).filter(Boolean),
  }))

  const payload = {
    exported_at: new Date().toISOString(),
    cycles: cyclesRes.data ?? [],
    daily_logs: logs,
  }

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `cycle-tracker-export-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}
