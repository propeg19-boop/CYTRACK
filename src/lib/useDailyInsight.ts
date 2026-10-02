import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured, supabaseUrl } from './supabase';
import { useAuth } from './AuthContext';
import { formatDateString } from './cycleStats';

export interface DailyInsightState {
  insight: string | null;
  disclaimer: string;
  loading: boolean;
  cached: boolean;
}

export function useDailyInsight(
  cycleDay: number | null,
  recentMoods: string[] = [],
  recentSymptoms: string[] = []
) {
  const { user, profile, isDemoMode } = useAuth();
  const [insightState, setInsightState] = useState<DailyInsightState>({
    insight: null,
    disclaimer: 'AI-generated and for informational purposes only. Not medical advice.',
    loading: true,
    cached: false,
  });

  const todayStr = formatDateString(new Date());

  const fetchInsight = useCallback(async () => {
    if (!user) {
      setInsightState(prev => ({ ...prev, loading: false }));
      return;
    }

    // 1. Check local/demo cache
    const cacheKey = `cytrack_insight_${user.id}_${todayStr}`;
    const localCached = localStorage.getItem(cacheKey);
    if (localCached) {
      const parsed = JSON.parse(localCached);
      setInsightState({
        insight: parsed.insight,
        disclaimer: parsed.disclaimer || 'AI-generated and for informational purposes only. Not medical advice.',
        loading: false,
        cached: true,
      });
      return;
    }

    if (isDemoMode || !isSupabaseConfigured) {
      // Deterministic friendly fallback in demo mode
      let demoInsight = 'Take time to tune in to your energy today. Prioritizing hydration and gentle movement helps maintain natural rhythm.';
      if (cycleDay && cycleDay <= 5) {
        demoInsight = `Day ${cycleDay} of your cycle is a great time to rest, stay warm, and give your body extra gentle care.`;
      } else if (cycleDay && cycleDay >= 12 && cycleDay <= 16) {
        demoInsight = `Around Day ${cycleDay}, energy and focus naturally peak for many people. Notice how your body feels today.`;
      }

      const generated = {
        insight: demoInsight,
        disclaimer: 'AI-generated and for informational purposes only. Not medical advice.',
      };
      localStorage.setItem(cacheKey, JSON.stringify(generated));
      setInsightState({
        insight: generated.insight,
        disclaimer: generated.disclaimer,
        loading: false,
        cached: false,
      });
      return;
    }

    try {
      setInsightState(prev => ({ ...prev, loading: true }));

      // Call Supabase Edge Function with minimized payload (Notes strictly omitted)
      const session = (await supabase.auth.getSession()).data.session;
      const response = await fetch(`${supabaseUrl}/functions/v1/daily-insight`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify({
          cycleDay,
          recentMoods: recentMoods.slice(-4),
          recentSymptoms: recentSymptoms.slice(-4),
          tone: profile?.preferred_tone || 'warm',
        }),
      });

      if (!response.ok) {
        throw new Error(`Edge function returned ${response.status}`);
      }

      const data = await response.json();
      if (data.insight) {
        localStorage.setItem(cacheKey, JSON.stringify(data));
        setInsightState({
          insight: data.insight,
          disclaimer: data.disclaimer || 'AI-generated and for informational purposes only. Not medical advice.',
          loading: false,
          cached: data.cached || false,
        });
      }
    } catch (err) {
      console.warn('Could not fetch remote AI insight, using gentle offline guidance:', err);
      const fallback = cycleDay
        ? `You're on Day ${cycleDay} of your cycle. Logging daily flow and sensations builds richer clarity over time.`
        : 'Welcome back. Listening to subtle shifts in energy can help you flow naturally with your cycle.';
      setInsightState({
        insight: fallback,
        disclaimer: 'AI-generated and for informational purposes only. Not medical advice.',
        loading: false,
        cached: false,
      });
    }
  }, [user, profile, cycleDay, isDemoMode, todayStr]);

  useEffect(() => {
    fetchInsight();
  }, [fetchInsight]);

  return {
    ...insightState,
    refreshInsight: fetchInsight,
  };
}
