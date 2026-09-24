import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { useAuth } from './AuthContext'

export type LogWithSymptoms = {
  mood: string | null
  symptomNames: string[]
}

export function useAnalyticsLogs() {
  const { session } = useAuth()
  const [logs, setLogs] = useState<LogWithSymptoms[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!session) return
    let cancelled = false

    async function run() {
      setLoading(true)
      const { data, error } = await supabase
        .from('daily_logs')
        .select('mood, daily_symptoms(symptom:symptoms(name))')

      if (cancelled) return
      if (error) {
        setError(error.message)
      } else {
        setError(null)
        setLogs(
          (data ?? []).map((row: any) => ({
            mood: row.mood,
            symptomNames: (row.daily_symptoms ?? [])
              .map((ds: any) => ds.symptom?.name)
              .filter(Boolean),
          })),
        )
      }
      setLoading(false)
    }

    run()
    return () => {
      cancelled = true
    }
  }, [session])

  return { logs, loading, error }
}
