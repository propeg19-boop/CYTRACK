import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'
import { useAuth } from './AuthContext'
import { todayISO, type Cycle } from './cycleStats'

export function useCycles() {
  const { session } = useAuth()
  const [cycles, setCycles] = useState<Cycle[]>([]) // oldest first
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!session) return
    setLoading(true)
    const { data, error } = await supabase
      .from('cycles')
      .select('id, start_date, end_date')
      .order('start_date', { ascending: true })

    if (error) setError(error.message)
    else {
      setError(null)
      setCycles(data ?? [])
    }
    setLoading(false)
  }, [session])

  useEffect(() => {
    refresh()
  }, [refresh])

  const openCycle = cycles.find((c) => c.end_date === null) ?? null

  async function startPeriod() {
    if (!session || openCycle) return
    const { error } = await supabase
      .from('cycles')
      .insert({ user_id: session.user.id, start_date: todayISO() })
    if (error) setError(error.message)
    else await refresh()
  }

  async function endPeriod() {
    if (!openCycle) return
    const { error } = await supabase
      .from('cycles')
      .update({ end_date: todayISO() })
      .eq('id', openCycle.id)
    if (error) setError(error.message)
    else await refresh()
  }

  async function updateCycle(id: string, updates: Partial<Pick<Cycle, 'start_date' | 'end_date'>>) {
    const { error } = await supabase.from('cycles').update(updates).eq('id', id)
    if (error) setError(error.message)
    else await refresh()
  }

  async function deleteCycle(id: string) {
    const { error } = await supabase.from('cycles').delete().eq('id', id)
    if (error) setError(error.message)
    else await refresh()
  }

  return { cycles, openCycle, loading, error, startPeriod, endPeriod, updateCycle, deleteCycle }
}
