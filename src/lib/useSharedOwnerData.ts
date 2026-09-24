import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { computeCycleStats, type Cycle, type CycleStats } from './cycleStats'

export type PartnerLogRow = {
  log_date: string
  mood: string | null
  energy: number | null
  flow: string | null
  notes: string | null
  symptom_names: string[] | null
}

export function useSharedOwnerData(ownerId: string | undefined) {
  const [stats, setStats] = useState<CycleStats | null>(null)
  const [logs, setLogs] = useState<PartnerLogRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!ownerId) return
    let cancelled = false

    async function run() {
      setLoading(true)
      const [cyclesRes, logsRes] = await Promise.all([
        supabase
          .from('cycles')
          .select('id, start_date, end_date')
          .eq('user_id', ownerId)
          .order('start_date', { ascending: true }),
        supabase.rpc('get_partner_logs', { p_owner_id: ownerId }),
      ])

      if (cancelled) return

      if (cyclesRes.error) setError(cyclesRes.error.message)
      else setStats(computeCycleStats((cyclesRes.data as Cycle[]) ?? []))

      if (logsRes.error) setError((e) => e ?? logsRes.error!.message)
      else setLogs(((logsRes.data as PartnerLogRow[]) ?? []).slice().reverse())

      setLoading(false)
    }

    run()
    return () => {
      cancelled = true
    }
  }, [ownerId])

  return { stats, logs, loading, error }
}
