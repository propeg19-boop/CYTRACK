import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'
import { todayISO } from './cycleStats'

export type Observation = { id: string; observed_date: string; content: string }

export function useObservations(connectionId: string | undefined) {
  const [observations, setObservations] = useState<Observation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!connectionId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('partner_observations')
      .select('id, observed_date, content')
      .eq('connection_id', connectionId)
      .order('observed_date', { ascending: false })
    if (error) setError(error.message)
    else setObservations(data ?? [])
    setLoading(false)
  }, [connectionId])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function addObservation(content: string) {
    if (!connectionId || !content.trim()) return
    const { error } = await supabase
      .from('partner_observations')
      .insert({ connection_id: connectionId, observed_date: todayISO(), content: content.trim() })
    if (error) setError(error.message)
    else await refresh()
  }

  return { observations, loading, error, addObservation }
}
