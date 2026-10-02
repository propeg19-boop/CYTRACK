import React, { useState, useMemo } from 'react';
import { useCycles } from '../lib/useCycles';
import { useDailyLog } from '../lib/useDailyLog';
import { useTheme } from '../lib/ThemeContext';
import { parseDateString, formatDateString } from '../lib/cycleStats';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { ScreenTab } from '../components/BottomNav';

interface CalendarProps {
  onNavigate: (tab: ScreenTab) => void;
}

export const CalendarScreen: React.FC<CalendarProps> = ({ onNavigate }) => {
  const { cycles, stats } = useCycles();
  const { allLogs } = useDailyLog();
  const { theme } = useTheme();
  const c = theme.colors;
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const todayStr = formatDateString(new Date());

  const loggedPeriodDates = useMemo(() => {
    const dates = new Set<string>();
    for (const cycle of cycles) {
      const start = parseDateString(cycle.start_date);
      const end = cycle.end_date ? parseDateString(cycle.end_date) : new Date(start.getTime() + 4 * 24 * 60 * 60 * 1000);
      const current = new Date(start);
      while (current <= end) {
        dates.add(formatDateString(current));
        current.setDate(current.getDate() + 1);
      }
    }
    return dates;
  }, [cycles]);

  const predictedPeriodDates = useMemo(() => {
    const dates = new Set<string>();
    if (stats.estimatedNextPeriodStart) {
      const predStart = parseDateString(stats.estimatedNextPeriodStart);
      const duration = stats.averagePeriodDuration || 5;
      for (let i = 0; i < duration; i++) {
        const d = new Date(predStart);
        d.setDate(d.getDate() + i);
        dates.add(formatDateString(d));
      }
    }
    return dates;
  }, [stats]);

  const ovulationDates = useMemo(() => {
    const dates = new Set<string>();
    if (stats.estimatedOvulationDate) {
      const ovDate = parseDateString(stats.estimatedOvulationDate);
      for (let i = -2; i <= 2; i++) {
        const d = new Date(ovDate);
        d.setDate(d.getDate() + i);
        dates.add(formatDateString(d));
      }
    }
    return dates;
  }, [stats]);

  const calendarCells = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const cells: { dateStr: string; dayNumber: number; isCurrentMonth: boolean }[] = [];

    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevDate = new Date(year, month - 1, d);
      cells.push({
        dateStr: formatDateString(prevDate),
        dayNumber: d,
        isCurrentMonth: false,
      });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const curDate = new Date(year, month, d);
      cells.push({
        dateStr: formatDateString(curDate),
        dayNumber: d,
        isCurrentMonth: true,
      });
    }

    const remaining = 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(year, month + 1, d);
      cells.push({
        dateStr: formatDateString(nextDate),
        dayNumber: d,
        isCurrentMonth: false,
      });
    }

    return cells;
  }, [year, month]);

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const selectedDayLog = selectedDay ? allLogs.find(l => l.log_date === selectedDay) : null;
  const isSelectedPeriod = selectedDay ? loggedPeriodDates.has(selectedDay) : false;
  const isSelectedPredicted = selectedDay ? predictedPeriodDates.has(selectedDay) : false;

  return (
    <div className="pb-24 pt-4 px-4 sm:px-6 max-w-lg mx-auto space-y-6 animate-fade-in relative z-10">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: c.primary }}>Cycle Overview</span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold mt-0.5" style={{ color: c.text }}>{monthName}</h1>
        </div>
        <div
          className="flex items-center gap-1 p-1 rounded-2xl border"
          style={{ background: c.surface, borderColor: c.border, boxShadow: `0 4px 20px -2px ${c.shadowColor}` }}
        >
          <button
            onClick={prevMonth}
            aria-label="Previous Month"
            className="w-9 h-9 flex items-center justify-center rounded-xl min-w-touch min-h-touch transition-colors"
            style={{ color: c.textMuted }}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextMonth}
            aria-label="Next Month"
            className="w-9 h-9 flex items-center justify-center rounded-xl min-w-touch min-h-touch transition-colors"
            style={{ color: c.textMuted }}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div
        className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl text-[11px]"
        style={{
          background: c.cardBg + 'BB',
          border: `1px solid ${c.cardBorder}`,
          color: c.textMuted,
        }}
      >
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full shrink-0" style={{ background: c.primary }} />
          <span>Logged Period</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="w-3 h-3 rounded-full shrink-0"
            style={{ background: c.primarySoft, border: `2px dashed ${c.primary}80` }}
          />
          <span>Estimated Window</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="w-3 h-3 rounded-full shrink-0"
            style={{ background: c.accentSoft, border: `1px solid ${c.accent}` }}
          />
          <span>Ovulation / Fertile</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div
        className="rounded-[2rem] p-4 sm:p-6"
        style={{
          background: c.cardBg,
          border: `1px solid ${c.cardBorder}`,
          boxShadow: `0 8px 30px -4px ${c.shadowColor}`,
        }}
      >
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-[11px] font-bold uppercase tracking-wider py-1" style={{ color: c.textMuted }}>
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {calendarCells.map(cell => {
            const isToday = cell.dateStr === todayStr;
            const isLogged = loggedPeriodDates.has(cell.dateStr);
            const isPredicted = predictedPeriodDates.has(cell.dateStr);
            const isOvulation = ovulationDates.has(cell.dateStr);
            const hasLog = allLogs.some(l => l.log_date === cell.dateStr);

            let cellBgStyle: React.CSSProperties = { color: c.text };
            if (isLogged) {
              cellBgStyle = {
                background: c.primary,
                color: c.textInverse,
                fontWeight: 700,
                boxShadow: `0 2px 8px ${c.primary}30`,
              };
            } else if (isPredicted) {
              cellBgStyle = {
                background: c.primarySoft,
                border: `1px dashed ${c.primary}80`,
                color: c.primary,
                fontWeight: 600,
              };
            } else if (isOvulation) {
              cellBgStyle = {
                background: c.accentSoft,
                color: c.accent,
                fontWeight: 500,
              };
            }

            if (!cell.isCurrentMonth) {
              cellBgStyle = { ...cellBgStyle, opacity: 0.3, color: c.textMuted };
            }

            return (
              <button
                key={cell.dateStr}
                onClick={() => setSelectedDay(cell.dateStr)}
                aria-label={`Select date ${cell.dateStr}${isLogged ? ', period logged' : ''}${isPredicted ? ', estimated period' : ''}`}
                className={`relative aspect-square flex flex-col items-center justify-center rounded-2xl text-xs transition-all min-h-[44px]`}
                style={{
                  ...cellBgStyle,
                  ...(isToday ? { boxShadow: `0 0 0 2px ${c.text}`, outline: `2px solid transparent`, outlineOffset: '2px' } : {}),
                }}
              >
                <span>{cell.dayNumber}</span>
                {hasLog && !isLogged && (
                  <span className="absolute bottom-1.5 w-1 h-1 rounded-full" style={{ background: c.primary }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <Modal
        isOpen={Boolean(selectedDay)}
        onClose={() => setSelectedDay(null)}
        title={selectedDay ? `Details for ${selectedDay}` : 'Date Details'}
      >
        <div className="space-y-4">
          <div
            className="p-4 rounded-2xl space-y-2 text-xs"
            style={{ background: c.bgSecondary, border: `1px solid ${c.border}` }}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold" style={{ color: c.text }}>Period Status:</span>
              <span className="font-bold" style={{ color: c.primary }}>
                {isSelectedPeriod
                  ? 'Logged Period Bleed'
                  : isSelectedPredicted
                  ? 'Estimated Period Window'
                  : 'No bleeding logged'}
              </span>
            </div>

            {selectedDayLog && (
              <>
                <div className="flex items-center justify-between pt-1" style={{ borderTop: `1px solid ${c.border}` }}>
                  <span style={{ color: c.textMuted }}>Flow:</span>
                  <span className="font-medium capitalize" style={{ color: c.text }}>{selectedDayLog.flow || 'None'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: c.textMuted }}>Mood:</span>
                  <span className="font-medium capitalize" style={{ color: c.text }}>{selectedDayLog.mood || 'Not recorded'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: c.textMuted }}>Energy Level:</span>
                  <span className="font-medium" style={{ color: c.text }}>{selectedDayLog.energy ? `${selectedDayLog.energy}/5` : 'Not recorded'}</span>
                </div>
                {selectedDayLog.symptoms && selectedDayLog.symptoms.length > 0 && (
                  <div className="pt-1" style={{ borderTop: `1px solid ${c.border}` }}>
                    <span className="block mb-1" style={{ color: c.textMuted }}>Symptoms:</span>
                    <div className="flex flex-wrap gap-1">
                      {selectedDayLog.symptoms.map(s => (
                        <span
                          key={s}
                          className="px-2 py-0.5 rounded-md text-[10px] font-medium"
                          style={{ background: c.bgSecondary, color: c.text }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setSelectedDay(null);
              onNavigate('log');
            }}
            className="w-full"
            icon={<Plus className="w-4 h-4" />}
          >
            {selectedDayLog ? 'Edit Daily Log' : 'Create Daily Log for this Date'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};
