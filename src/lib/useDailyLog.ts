import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'
import { useAuth } from './AuthContext'

export type Flow = 'none' | 'spotting' | 'light' | 'medium' | 'heavy'

export type DailyLog = {
  mood: string | null
  energy: number | null
  flow: Flow | null
  notes: string | null
}

export type Symptom = { id: number; name: string }

const emptyLog: DailyLog = { mood: null, energy: null, flow: null, notes: null }

export function useDailyLog(dateISO: string) {
  const { session } = useAuth()
  const [log, setLog] = useState<DailyLog>(emptyLog)
  const [selectedSymptomIds, setSelectedSymptomIds] = useState<Set<number>>(new Set())
  const [allSymptoms, setAllSymptoms] = useState<Symptom[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!session) return
    setLoading(true)
    setError(null)

    const [symptomsRes, logRes] = await Promise.all([
      supabase.from('symptoms').select('id, name').order('name'),
      supabase
        .from('daily_logs')
        .select('id, mood, energy, flow, notes')
        .eq('log_date', dateISO)
        .maybeSingle(),
    ])

    if (symptomsRes.error) setError(symptomsRes.error.message)
    else setAllSymptoms(symptomsRes.data ?? [])

    if (logRes.error) {
      setError(logRes.error.message)
      setLoading(false)
      return
    }

    if (!logRes.data) {
      setLog(emptyLog)
      setSelectedSymptomIds(new Set())
      setLoading(false)
      return
    }

    const { id, ...rest } = logRes.data
    setLog(rest)

    const { data: tagRows, error: tagErr } = await supabase
      .from('daily_symptoms')
      .select('symptom_id')
      .eq('daily_log_id', id)

    if (tagErr) setError(tagErr.message)
    else setSelectedSymptomIds(new Set((tagRows ?? []).map((r) => r.symptom_id)))

    setLoading(false)
  }, [session, dateISO])

  useEffect(() => {
    refresh()
  }, [refresh])

  function toggleSymptom(id: number) {
    setSelectedSymptomIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function save() {
    if (!session) return
    setSaving(true)
    setError(null)

    const { data: upserted, error: upsertErr } = await supabase
      .from('daily_logs')
      .upsert(
        { user_id: session.user.id, log_date: dateISO, ...log },
        { onConflict: 'user_id,log_date' },
      )
      .select('id')
      .single()

    if (upsertErr || !upserted) {
      setError(upsertErr?.message ?? 'Could not save log.')
      setSaving(false)
      return
    }

    // Replace this day's symptom tags wholesale — simplest correct approach
    // for a small per-day set (max ~10 rows), no diffing needed.
    await supabase.from('daily_symptoms').delete().eq('daily_log_id', upserted.id)
    if (selectedSymptomIds.size > 0) {
      const rows = [...selectedSymptomIds].map((symptom_id) => ({
        daily_log_id: upserted.id,
        symptom_id,
      }))
      const { error: tagErr } = await supabase.from('daily_symptoms').insert(rows)
      if (tagErr) setError(tagErr.message)
    }

    setSaving(false)
  }

  return { log, setLog, allSymptoms, selectedSymptomIds, toggleSymptom, loading, saving, error, save }
}
