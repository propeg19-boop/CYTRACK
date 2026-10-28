import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from './supabase';
import { useAuth } from './AuthContext';
import { Cycle } from './types';
import { calculateCycleStats, formatDateString } from './cycleStats';

const LEGACY_CYCLES_KEY = 'cytrack_demo_cycles';
const getUserCyclesKey = (userId: string) => `cytrack_cycles_${userId}`;

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
      const userKey = getUserCyclesKey(user.id);
      const userStored = localStorage.getItem(userKey);
      const legacyStored = localStorage.getItem(LEGACY_CYCLES_KEY);

      if (userStored) {
        setCycles(JSON.parse(userStored));
      } else if (legacyStored) {
        const parsed = JSON.parse(legacyStored);
        setCycles(parsed);
        localStorage.setItem(userKey, JSON.stringify(parsed));
      } else {
        // Default initial demo cycle for testing
        const initialDate = new Date();
        initialDate.setDate(initialDate.getDate() - 12);
        const demo: Cycle[] = [
          {
            id: 'cycle_' + Date.now(),
            user_id: user.id,
            start_date: formatDateString(initialDate),
            end_date: formatDateString(new Date(initialDate.getTime() + 4 * 24 * 60 * 60 * 1000)),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ];
        localStorage.setItem(userKey, JSON.stringify(demo));
        localStorage.setItem(LEGACY_CYCLES_KEY, JSON.stringify(demo));
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
      const loaded = (data as Cycle[]) || [];
      setCycles(loaded);
      // Cache locally for offline resilience
      if (user) {
        localStorage.setItem(getUserCyclesKey(user.id), JSON.stringify(loaded));
      }
      setError(null);
    } catch (err: any) {
      console.warn('Error fetching cycles from Supabase, checking local cache:', err);
      if (user) {
        const cached = localStorage.getItem(getUserCyclesKey(user.id));
        if (cached) {
          setCycles(JSON.parse(cached));
        }
      }
      setError(err.message || 'Failed to load cycles');
    } finally {
      setLoading(false);
    }
  }, [user, isDemoMode]);

  useEffect(() => {
    fetchCycles();
  }, [fetchCycles]);

  const saveLocalCycles = (updated: Cycle[]) => {
    if (!user) return;
    setCycles(updated);
    localStorage.setItem(getUserCyclesKey(user.id), JSON.stringify(updated));
    localStorage.setItem(LEGACY_CYCLES_KEY, JSON.stringify(updated));
  };

  const startPeriod = async (startDate: string = formatDateString(new Date())) => {
    if (!user) return;

    if (isDemoMode || !isSupabaseConfigured) {
      const newCycle: Cycle = {
        id: 'cycle_' + Date.now(),
        user_id: user.id,
        start_date: startDate,
        end_date: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const updated = [newCycle, ...cycles];
      saveLocalCycles(updated);
      return;
    }

    try {
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
        const updated = [data as Cycle, ...cycles];
        saveLocalCycles(updated);
      }
    } catch (e) {
      // Fallback local
      const newCycle: Cycle = {
        id: 'cycle_' + Date.now(),
        user_id: user.id,
        start_date: startDate,
        end_date: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      saveLocalCycles([newCycle, ...cycles]);
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
      saveLocalCycles(updated);
      return;
    }

    try {
      const { error } = await supabase
        .from('cycles')
        .update({ end_date: endDate, updated_at: new Date().toISOString() })
        .eq('id', activeCycle.id);

      if (error) throw error;
      const updated = cycles.map(c => (c.id === activeCycle.id ? { ...c, end_date: endDate } : c));
      saveLocalCycles(updated);
    } catch (e) {
      const updated = cycles.map(c =>
        c.id === activeCycle.id ? { ...c, end_date: endDate, updated_at: new Date().toISOString() } : c
      );
      saveLocalCycles(updated);
    }
  };

  const updateCycle = async (id: string, updates: Partial<Cycle>) => {
    const updated = cycles.map(c => (c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c));
    saveLocalCycles(updated);

    if (isSupabaseConfigured && !isDemoMode) {
      try {
        await supabase
          .from('cycles')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', id);
      } catch (err) {
        console.warn('Supabase cycle update warning:', err);
      }
    }
  };

  const deleteCycle = async (id: string) => {
    const updated = cycles.filter(c => c.id !== id);
    saveLocalCycles(updated);

    if (isSupabaseConfigured && !isDemoMode) {
      try {
        await supabase.from('cycles').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase cycle delete warning:', err);
      }
    }
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
