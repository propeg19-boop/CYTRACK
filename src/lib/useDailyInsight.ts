import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export function useDailyInsight() {
  const [content, setContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function run() {
      setLoading(true)
      const { data, error } = await supabase.functions.invoke('daily-insight')
      if (cancelled) return
      if (error) setError(error.message)
      else setContent((data as { content: string })?.content ?? null)
      setLoading(false)
    }

    run()
    return () => {
      cancelled = true
    }
  }, [])

  return { content, loading, error }
}
