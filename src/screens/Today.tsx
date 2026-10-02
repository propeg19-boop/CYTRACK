import React, { useState } from 'react';
import { useCycles } from '../lib/useCycles';
import { useDailyLog } from '../lib/useDailyLog';
import { useDailyInsight } from '../lib/useDailyInsight';
import { useTheme } from '../lib/ThemeContext';
import { Button } from '../components/Button';
import { formatDateString } from '../lib/cycleStats';
import { Sparkles, Droplet, PlusCircle, CheckCircle, Info, Calendar as CalendarIcon, Heart, ChevronRight } from 'lucide-react';
import { ScreenTab } from '../components/BottomNav';

interface TodayProps {
  onNavigate: (tab: ScreenTab) => void;
}

/** Inner Seasons mapping — metaphors for each cycle phase */
const getPhaseData = (cycleDay: number | null, isPeriodActive: boolean, periodDay: number | null) => {
  if (isPeriodActive) {
    return {
      name: 'Inner Winter',
      subtitle: 'Menstrual Phase',
      description: `Rest & renewal — Day ${periodDay || 1} of your bleed`,
      emoji: '❄️',
      seasonWord: 'Stillness',
      tip: 'Honor your body\'s need for rest. Gentle warmth and introspection suit this phase.',
    };
  }

  if (!cycleDay) {
    return {
      name: 'Inner Spring',
      subtitle: 'Follicular Phase',
      description: 'Awakening energy and new beginnings',
      emoji: '🌱',
      seasonWord: 'Emergence',
      tip: 'Your energy is rising — a wonderful time for planning and creative projects.',
    };
  }

  if (cycleDay >= 13 && cycleDay <= 16) {
    return {
      name: 'Inner Summer',
      subtitle: 'Ovulation Window',
      description: 'Peak vitality, bloom and full expression',
      emoji: '☀️',
      seasonWord: 'Radiance',
      tip: 'You\'re in your social superpower window. Great for connecting and communicating.',
    };
  }

  if (cycleDay > 16) {
    return {
      name: 'Inner Autumn',
      subtitle: 'Luteal Phase',
      description: 'Harvest, reflect, and gently slow down',
      emoji: '🍂',
      seasonWord: 'Reflection',
      tip: 'Tie up loose ends, prioritize self-care, and ease into a nurturing rhythm.',
    };
  }

  return {
    name: 'Inner Spring',
    subtitle: 'Follicular Phase',
    description: 'Estrogen rises — renewal, curiosity, and rising energy',
    emoji: '🌱',
    seasonWord: 'Emergence',
    tip: 'Set intentions for the cycle ahead. Your body is rebuilding and brightening.',
  };
};

export const TodayScreen: React.FC<TodayProps> = ({ onNavigate }) => {
  const { stats, startPeriod, endPeriod } = useCycles();
  const { theme } = useTheme();
  const c = theme.colors;
  const todayStr = formatDateString(new Date());
  const { log, allLogs } = useDailyLog(todayStr);

  const [periodActionLoading, setPeriodActionLoading] = useState(false);

  const recentMoods = allLogs.filter(l => l.mood).map(l => l.mood as string);
  const recentSymptoms = allLogs.flatMap(l => l.symptoms || []);

  const { insight, disclaimer } = useDailyInsight(
    stats.currentCycleDay,
    recentMoods,
    recentSymptoms
  );

  const handlePeriodToggle = async () => {
    setPeriodActionLoading(true);
    try {
      if (stats.isPeriodActive) {
        await endPeriod(todayStr);
      } else {
        await startPeriod(todayStr);
      }
    } catch (err) {
      console.error('Error toggling period:', err);
    } finally {
      setPeriodActionLoading(false);
    }
  };

  const phase = getPhaseData(stats.currentCycleDay, stats.isPeriodActive, stats.activePeriodDay);

  let daysUntilPeriod: number | null = null;
  if (stats.estimatedNextPeriodStart) {
    const diff = Math.round(
      (new Date(stats.estimatedNextPeriodStart).getTime() - new Date(todayStr).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    daysUntilPeriod = diff;
  }

  return (
    <div className="pb-24 pt-4 px-4 sm:px-6 max-w-lg mx-auto space-y-6 animate-fade-in relative z-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: c.primary }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold mt-0.5" style={{ color: c.text }}>
            {phase.seasonWord}
          </h1>
        </div>
        <button
          onClick={() => onNavigate('settings')}
          className="w-10 h-10 rounded-2xl flex items-center justify-center border transition-colors"
          style={{
            background: c.surface,
            borderColor: c.border,
            color: c.primary,
          }}
          aria-label="Open Settings"
        >
          <Heart className="w-5 h-5" />
        </button>
      </div>

      {/* ─── Phase Season Badge ─── */}
      <div
        className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl"
        style={{ background: c.primarySoft, border: `1px solid ${c.border}` }}
      >
        <span className="text-xl">{phase.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold" style={{ color: c.primary }}>{phase.name}</p>
          <p className="text-[10px]" style={{ color: c.textMuted }}>{phase.tip}</p>
        </div>
      </div>

      {/* ─── Main Cycle Ring Card ─── */}
      <div
        className="relative rounded-[2rem] p-8 text-center space-y-6 overflow-hidden"
        style={{
          background: `linear-gradient(180deg, ${c.surface}, ${c.surfaceSoft})`,
          border: `1px solid ${c.cardBorder}`,
          boxShadow: `0 8px 30px -4px ${c.shadowColor}`,
        }}
      >
        {/* Decorative blur orbs */}
        <div
          className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl pointer-events-none"
          style={{ background: c.primarySoft, opacity: 0.5 }}
        />
        <div
          className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full blur-3xl pointer-events-none"
          style={{ background: c.accentSoft, opacity: 0.5 }}
        />

        <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="transparent"
              stroke={c.ringTrack}
              strokeWidth="6"
            />
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="transparent"
              stroke={c.ringActive}
              strokeWidth="7"
              strokeDasharray={264}
              strokeDashoffset={
                stats.currentCycleDay
                  ? Math.max(0, 264 - (264 * (stats.currentCycleDay % stats.averageCycleLength)) / stats.averageCycleLength)
                  : 200
              }
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
              style={{ filter: `drop-shadow(0 0 6px ${c.primary}40)` }}
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
            <span className="text-[11px] font-semibold tracking-wider uppercase" style={{ color: c.textMuted }}>
              {stats.isPeriodActive ? 'Period Active' : phase.subtitle}
            </span>
            <span className="font-serif text-4xl sm:text-5xl font-bold my-0.5" style={{ color: c.text }}>
              {stats.isPeriodActive
                ? `Day ${stats.activePeriodDay || 1}`
                : stats.currentCycleDay
                ? `Day ${stats.currentCycleDay}`
                : 'Day 1'}
            </span>
            <span className="text-xs font-medium" style={{ color: c.textMuted }}>{phase.name}</span>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-xs max-w-xs mx-auto" style={{ color: c.textMuted }}>{phase.description}</p>
          {daysUntilPeriod !== null && !stats.isPeriodActive && (
            <p className="text-xs font-semibold" style={{ color: c.primary }}>
              {daysUntilPeriod > 0
                ? `Estimated period in ~${daysUntilPeriod} day${daysUntilPeriod > 1 ? 's' : ''}`
                : daysUntilPeriod === 0
                ? 'Period estimated around today'
                : 'Period estimation window'}
            </p>
          )}
        </div>

        <Button
          variant={stats.isPeriodActive ? 'outline' : 'primary'}
          size="lg"
          loading={periodActionLoading}
          onClick={handlePeriodToggle}
          className="w-full shadow-soft"
          icon={<Droplet className="w-5 h-5" />}
        >
          {stats.isPeriodActive ? 'End Period Today' : 'Start Period Today'}
        </Button>
      </div>

      {/* ─── Daily Log Quick Action ─── */}
      <div
        className="rounded-3xl p-5 flex items-center justify-between gap-4"
        style={{
          background: c.cardBg,
          border: `1px solid ${c.cardBorder}`,
          boxShadow: `0 4px 20px -2px ${c.shadowColor}`,
        }}
      >
        <div className="flex items-center gap-3.5">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
            style={{
              background: log ? c.successBg : c.primarySoft,
              color: log ? c.successText : c.primary,
            }}
          >
            {log ? <CheckCircle className="w-6 h-6" /> : <PlusCircle className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: c.text }}>
              {log ? "Today's Log Recorded" : 'Log Flow, Mood & Symptoms'}
            </h3>
            <p className="text-xs" style={{ color: c.textMuted }}>
              {log
                ? `${log.flow ? `Flow: ${log.flow}` : ''} ${log.mood ? `• Mood: ${log.mood}` : ''}`
                : 'Track daily wellness patterns in seconds'}
            </p>
          </div>
        </div>
        <button
          onClick={() => onNavigate('log')}
          className="min-h-touch px-4 py-2 rounded-2xl text-xs font-semibold flex items-center gap-1 transition-colors shrink-0"
          style={{
            background: c.bgSecondary,
            color: c.text,
          }}
        >
          <span>{log ? 'Edit' : 'Log'}</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ─── Gentle Daily Insight Card ─── */}
      <div
        className="rounded-3xl p-6 space-y-3"
        style={{
          background: `linear-gradient(135deg, ${c.primarySoft}, ${c.accentSoft})`,
          border: `1px solid ${c.borderSoft}`,
          boxShadow: `0 4px 20px -2px ${c.shadowColor}`,
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider" style={{ color: c.primary }}>
            <Sparkles className="w-4 h-4" />
            <span>Gentle Daily Insight</span>
          </div>
          <span
            className="text-[10px] px-2 py-0.5 rounded-full border"
            style={{
              background: c.surface + 'CC',
              color: c.textMuted,
              borderColor: c.border,
            }}
          >
            {stats.hasSufficientData ? 'Personalized' : 'Baseline'}
          </span>
        </div>

        <p className="text-sm leading-relaxed italic" style={{ color: c.text }}>
          "{insight || 'Stay mindful of your energy and rest as needed throughout your day.'}"
        </p>

        <div className="pt-2 flex items-center gap-1.5 text-[10px]" style={{ borderTop: `1px solid ${c.borderSoft}`, color: c.textMuted }}>
          <Info className="w-3 h-3 shrink-0" />
          <span>{disclaimer}</span>
        </div>
      </div>

      {/* ─── Calendar Teaser ─── */}
      <div
        onClick={() => onNavigate('calendar')}
        className="rounded-3xl p-5 flex items-center justify-between cursor-pointer transition-all group"
        style={{
          background: c.cardBg + 'DD',
          border: `1px solid ${c.cardBorder}`,
          boxShadow: `0 4px 20px -2px ${c.shadowColor}`,
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center transition-colors"
            style={{
              background: c.bgSecondary,
              color: c.textMuted,
            }}
          >
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold" style={{ color: c.text }}>View Month Calendar</h4>
            <p className="text-[11px]" style={{ color: c.textMuted }}>
              {stats.estimatedPeriodWindow
                ? `Next window: ${stats.estimatedPeriodWindow.start} – ${stats.estimatedPeriodWindow.end}`
                : 'Explore full cycle timeline'}
            </p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" style={{ color: c.textMuted }} />
      </div>
    </div>
  );
};
