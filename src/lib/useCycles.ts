import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from './supabase';
import { useAuth } from './AuthContext';
import { Cycle } from './types';
import { calculateCycleStats, formatDateString } from './cycleStats';

const LOCAL_CYCLES_KEY = 'cytrack_demo_cycles';

export function useCycles() {
  const { user, isDemoMode, profile } = useAuth();
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCycles = useCallback(async () => {
    if (!user) {
      setCycles([]);
      setLoading(false);
      return;
    }

    if (isDemoMode || !isSupabaseConfigured) {
      const stored = localStorage.getItem(LOCAL_CYCLES_KEY);
      if (stored) {
        setCycles(JSON.parse(stored));
      } else {
        // Default initial demo cycle for testing
        const initialDate = new Date();
        initialDate.setDate(initialDate.getDate() - 12);
        const demo: Cycle[] = [
          {
            id: 'demo-cycle-1',
            user_id: user.id,
            start_date: formatDateString(initialDate),
            end_date: formatDateString(new Date(initialDate.getTime() + 4 * 24 * 60 * 60 * 1000)),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ];
        localStorage.setItem(LOCAL_CYCLES_KEY, JSON.stringify(demo));
        setCycles(demo);
      }
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchErr } = await supabase
        .from('cycles')
        .select('*')
        .eq('user_id', user.id)
        .order('start_date', { ascending: false });

      if (fetchErr) throw fetchErr;
      setCycles((data as Cycle[]) || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching cycles:', err);
      setError(err.message || 'Failed to load cycles');
    } finally {
      setLoading(false);
    }
  }, [user, isDemoMode]);

  useEffect(() => {
    fetchCycles();
  }, [fetchCycles]);

  const startPeriod = async (startDate: string = formatDateString(new Date())) => {
    if (!user) return;

    if (isDemoMode || !isSupabaseConfigured) {
      const newCycle: Cycle = {
        id: 'cycle-' + Date.now(),
        user_id: user.id,
        start_date: startDate,
        end_date: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const updated = [newCycle, ...cycles];
      setCycles(updated);
      localStorage.setItem(LOCAL_CYCLES_KEY, JSON.stringify(updated));
      return;
    }

    const { data, error } = await supabase
      .from('cycles')
      .insert({
        user_id: user.id,
        start_date: startDate,
        end_date: null,
      })
      .select()
      .single();

    if (error) throw error;
    if (data) {
      setCycles(prev => [data as Cycle, ...prev]);
    }
  };

  const endPeriod = async (endDate: string = formatDateString(new Date())) => {
    if (!user || cycles.length === 0) return;
    const activeCycle = cycles.find(c => !c.end_date);
    if (!activeCycle) return;

    if (isDemoMode || !isSupabaseConfigured) {
      const updated = cycles.map(c =>
        c.id === activeCycle.id ? { ...c, end_date: endDate, updated_at: new Date().toISOString() } : c
      );
      setCycles(updated);
      localStorage.setItem(LOCAL_CYCLES_KEY, JSON.stringify(updated));
      return;
    }

    const { error } = await supabase
      .from('cycles')
      .update({ end_date: endDate, updated_at: new Date().toISOString() })
      .eq('id', activeCycle.id);

    if (error) throw error;
    setCycles(prev =>
      prev.map(c => (c.id === activeCycle.id ? { ...c, end_date: endDate } : c))
    );
  };

  const updateCycle = async (id: string, updates: Partial<Cycle>) => {
    if (isDemoMode || !isSupabaseConfigured) {
      const updated = cycles.map(c => (c.id === id ? { ...c, ...updates } : c));
      setCycles(updated);
      localStorage.setItem(LOCAL_CYCLES_KEY, JSON.stringify(updated));
      return;
    }

    const { error } = await supabase
      .from('cycles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
    setCycles(prev => prev.map(c => (c.id === id ? { ...c, ...updates } : c)));
  };

  const deleteCycle = async (id: string) => {
    if (isDemoMode || !isSupabaseConfigured) {
      const updated = cycles.filter(c => c.id !== id);
      setCycles(updated);
      localStorage.setItem(LOCAL_CYCLES_KEY, JSON.stringify(updated));
      return;
    }

    const { error } = await supabase.from('cycles').delete().eq('id', id);
    if (error) throw error;
    setCycles(prev => prev.filter(c => c.id !== id));
  };

  const stats = calculateCycleStats(
    cycles,
    new Date(),
    profile?.typical_cycle_length || 28,
    profile?.typical_period_duration || 5
  );

  return {
    cycles,
    stats,
    loading,
    error,
    startPeriod,
    endPeriod,
    updateCycle,
    deleteCycle,
    refreshCycles: fetchCycles,
  };
}
