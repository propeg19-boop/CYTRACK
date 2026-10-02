import React from 'react';
import { useCycles } from '../lib/useCycles';
import { useDailyLog } from '../lib/useDailyLog';
import { useTheme } from '../lib/ThemeContext';
import { Activity, Smile, Info, TrendingUp } from 'lucide-react';
import { Button } from '../components/Button';
import { ScreenTab } from '../components/BottomNav';

interface InsightsProps {
  onNavigate: (tab: ScreenTab) => void;
}

export const InsightsScreen: React.FC<InsightsProps> = ({ onNavigate }) => {
  const { cycles, stats } = useCycles();
  const { allLogs, symptomsList } = useDailyLog();
  const { theme } = useTheme();
  const c = theme.colors;

  const symptomCounts: Record<string, number> = {};
  allLogs.forEach(l => {
    (l.symptoms || []).forEach(symId => {
      const symName = symptomsList.find(s => s.id === symId)?.name || symId;
      symptomCounts[symName] = (symptomCounts[symName] || 0) + 1;
    });
  });

  const sortedSymptoms = Object.entries(symptomCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const moodCounts: Record<string, number> = {};
  allLogs.forEach(l => {
    if (l.mood) {
      moodCounts[l.mood] = (moodCounts[l.mood] || 0) + 1;
    }
  });

  const sortedMoods = Object.entries(moodCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const maxSymptomCount = Math.max(...Object.values(symptomCounts), 1);
  const maxMoodCount = Math.max(...Object.values(moodCounts), 1);

  return (
    <div className="pb-24 pt-4 px-4 sm:px-6 max-w-lg mx-auto space-y-6 animate-fade-in">
      <div>
        <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: c.primary }}>
          Cycle Analytics
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold mt-0.5" style={{ color: c.text }}>
          Patterns & Trends
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div
          className="p-5 rounded-3xl border shadow-soft space-y-1 transition-all"
          style={{ background: c.cardBg, borderColor: c.cardBorder }}
        >
          <span className="text-xs font-medium" style={{ color: c.textMuted }}>Avg Cycle Length</span>
          <div className="font-serif text-3xl font-bold" style={{ color: c.text }}>
            {stats.averageCycleLength} <span className="text-sm font-normal font-sans" style={{ color: c.textMuted }}>days</span>
          </div>
          <span className="text-[11px] block font-medium" style={{ color: c.primary }}>
            {stats.hasSufficientData ? 'Based on logged history' : 'Baseline preference'}
          </span>
        </div>

        <div
          className="p-5 rounded-3xl border shadow-soft space-y-1 transition-all"
          style={{ background: c.cardBg, borderColor: c.cardBorder }}
        >
          <span className="text-xs font-medium" style={{ color: c.textMuted }}>Avg Period Bleed</span>
          <div className="font-serif text-3xl font-bold" style={{ color: c.text }}>
            {stats.averagePeriodDuration} <span className="text-sm font-normal font-sans" style={{ color: c.textMuted }}>days</span>
          </div>
          <span className="text-[11px] block font-medium" style={{ color: c.accent }}>
            {cycles.length} period{cycles.length === 1 ? '' : 's'} recorded
          </span>
        </div>
      </div>

      <div
        className="rounded-3xl p-6 border shadow-card space-y-4 transition-all"
        style={{ background: c.cardBg, borderColor: c.cardBorder }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" style={{ color: c.primary }} />
            <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: c.text }}>
              Cycle Length Trend
            </h2>
          </div>
          <span className="text-[11px]" style={{ color: c.textMuted }}>{stats.cycleLengthHistory.length} intervals</span>
        </div>

        {stats.cycleLengthHistory.length === 0 ? (
          <div className="py-6 text-center space-y-2">
            <p className="text-xs" style={{ color: c.textMuted }}>
              Log at least two period start dates to view your chronological cycle variation chart.
            </p>
            <Button variant="outline" size="sm" onClick={() => onNavigate('today')}>
              Log Period
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div
              className="h-32 flex items-end justify-around gap-2 pt-6 border-b"
              style={{ borderColor: c.cardBorder }}
            >
              {stats.cycleLengthHistory.slice(-6).map((len, idx) => {
                const heightPercent = Math.min(100, Math.max(20, ((len - 20) / (45 - 20)) * 100));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                    <span className="text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: c.text }}>
                      {len}d
                    </span>
                    <div
                      style={{
                        height: `${heightPercent}%`,
                        background: `linear-gradient(to top, ${c.primary}, ${c.accent})`,
                      }}
                      className="w-full max-w-[28px] rounded-t-xl shadow-soft transition-all duration-500"
                    />
                    <span className="text-[9px] font-medium" style={{ color: c.textMuted }}>#{idx + 1}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-center" style={{ color: c.textMuted }}>
              Historical cycle length in days between consecutive period starts
            </p>
          </div>
        )}
      </div>

      <div
        className="rounded-3xl p-6 border shadow-soft space-y-4 transition-all"
        style={{ background: c.cardBg, borderColor: c.cardBorder }}
      >
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider" style={{ color: c.text }}>
          <Activity className="w-4 h-4" style={{ color: c.primary }} />
          <span>Most Frequent Symptoms</span>
        </div>

        {sortedSymptoms.length === 0 ? (
          <p className="text-xs py-2" style={{ color: c.textMuted }}>
            No symptoms recorded yet. Track daily physical cues on the Log screen.
          </p>
        ) : (
          <div className="space-y-2.5">
            {sortedSymptoms.map(([symName, count]) => {
              const widthPct = (count / maxSymptomCount) * 100;
              return (
                <div key={symName} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium" style={{ color: c.text }}>{symName}</span>
                    <span className="font-semibold" style={{ color: c.textMuted }}>{count} time{count === 1 ? '' : 's'}</span>
                  </div>
                  <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: c.surfaceSoft }}>
                    <div
                      style={{ width: `${widthPct}%`, background: c.primary }}
                      className="h-full rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div
        className="rounded-3xl p-6 border shadow-soft space-y-4 transition-all"
        style={{ background: c.cardBg, borderColor: c.cardBorder }}
      >
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider" style={{ color: c.text }}>
          <Smile className="w-4 h-4" style={{ color: c.accent }} />
          <span>Emotional Rhythms</span>
        </div>

        {sortedMoods.length === 0 ? (
          <p className="text-xs py-2" style={{ color: c.textMuted }}>
            No mood entries logged yet. Track how you feel daily to view emotional shifts.
          </p>
        ) : (
          <div className="space-y-2.5">
            {sortedMoods.map(([moodName, count]) => {
              const widthPct = (count / maxMoodCount) * 100;
              return (
                <div key={moodName} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium capitalize" style={{ color: c.text }}>{moodName}</span>
                    <span className="font-semibold" style={{ color: c.textMuted }}>{count} day{count === 1 ? '' : 's'}</span>
                  </div>
                  <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: c.surfaceSoft }}>
                    <div
                      style={{ width: `${widthPct}%`, background: c.accent }}
                      className="h-full rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div
        className="p-4 rounded-2xl border flex items-start gap-2 text-[11px]"
        style={{ background: c.surfaceSoft, borderColor: c.cardBorder, color: c.textMuted }}
      >
        <Info className="w-4 h-4 shrink-0 mt-0.5" style={{ color: c.primary }} />
        <p>
          CYTRACK analytics provide observational cycle patterns and are not intended for medical diagnosis, contraception, or fertility treatment.
        </p>
      </div>
    </div>
  );
};
