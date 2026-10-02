import React, { useState, useEffect } from 'react';
import { useDailyLog } from '../lib/useDailyLog';
import { useTheme } from '../lib/ThemeContext';
import { FlowLevel, MoodType } from '../lib/types';
import { formatDateString } from '../lib/cycleStats';
import { Button } from '../components/Button';
import {
  Droplet,
  Smile,
  Lock,
  Check,
  BatteryCharging,
  Activity,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export const LogScreen: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(() => formatDateString(new Date()));
  const { log, symptomsList, saving, saveLog } = useDailyLog(selectedDate);
  const { theme } = useTheme();
  const c = theme.colors;

  const [flow, setFlow] = useState<FlowLevel | null>(null);
  const [mood, setMood] = useState<MoodType | null>(null);
  const [energy, setEnergy] = useState<number | null>(3);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (log) {
      setFlow(log.flow || null);
      setMood(log.mood || null);
      setEnergy(log.energy ?? 3);
      setSelectedSymptoms(log.symptoms || []);
      setNotes(log.notes || '');
    } else {
      setFlow(null);
      setMood(null);
      setEnergy(3);
      setSelectedSymptoms([]);
      setNotes('');
    }
    setSaveSuccess(false);
  }, [log, selectedDate]);

  const changeDateBy = (offset: number) => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + offset);
    setSelectedDate(formatDateString(date));
  };

  const toggleSymptom = (symId: string) => {
    setSelectedSymptoms(prev =>
      prev.includes(symId) ? prev.filter(id => id !== symId) : [...prev, symId]
    );
  };

  const handleSave = async () => {
    try {
      await saveLog({
        flow,
        mood,
        energy,
        symptoms: selectedSymptoms,
        notes: notes.trim() || null,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Save daily log failed:', err);
    }
  };

  const flowOptions: { id: FlowLevel; label: string; desc: string }[] = [
    { id: 'none', label: 'None', desc: 'No flow' },
    { id: 'spotting', label: 'Spotting', desc: 'Very light' },
    { id: 'light', label: 'Light', desc: 'Minimal bleed' },
    { id: 'medium', label: 'Medium', desc: 'Moderate bleed' },
    { id: 'heavy', label: 'Heavy', desc: 'Full bleed' },
  ];

  const moodOptions: { id: MoodType; label: string }[] = [
    { id: 'calm', label: 'Calm' },
    { id: 'happy', label: 'Happy' },
    { id: 'energetic', label: 'Energetic' },
    { id: 'sensitive', label: 'Sensitive' },
    { id: 'anxious', label: 'Anxious' },
    { id: 'irritated', label: 'Irritated' },
    { id: 'tired', label: 'Tired' },
    { id: 'sad', label: 'Low / Sad' },
  ];

  const cardStyle = {
    background: c.cardBg,
    border: `1px solid ${c.cardBorder}`,
    boxShadow: `0 4px 20px -2px ${c.shadowColor}`,
  };

  return (
    <div className="pb-24 pt-4 px-4 sm:px-6 max-w-lg mx-auto space-y-6 animate-fade-in relative z-10">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: c.primary }}>Daily Journal</span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold mt-0.5" style={{ color: c.text }}>Track Sensations</h1>
        </div>
        <div
          className="flex items-center gap-1 p-1 rounded-2xl border"
          style={{ background: c.surface, borderColor: c.border, boxShadow: `0 4px 20px -2px ${c.shadowColor}` }}
        >
          <button
            onClick={() => changeDateBy(-1)}
            aria-label="Previous Day"
            className="w-9 h-9 flex items-center justify-center rounded-xl min-w-touch min-h-touch transition-colors"
            style={{ color: c.textMuted }}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="text-xs font-semibold bg-transparent border-none focus:outline-none px-2 cursor-pointer"
            style={{ color: c.text }}
          />
          <button
            onClick={() => changeDateBy(1)}
            aria-label="Next Day"
            className="w-9 h-9 flex items-center justify-center rounded-xl min-w-touch min-h-touch transition-colors"
            style={{ color: c.textMuted }}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Flow */}
      <div className="rounded-3xl p-5 space-y-3" style={cardStyle}>
        <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: c.text }}>
          <Droplet className="w-4 h-4" style={{ color: c.primary }} />
          <span>Menstrual Flow</span>
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {flowOptions.map(opt => {
            const isSelected = flow === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setFlow(isSelected ? null : opt.id)}
                aria-pressed={isSelected}
                className="flex flex-col items-center justify-center py-2.5 px-1 rounded-2xl border transition-all min-h-touch"
                style={{
                  background: isSelected ? c.primary : c.surfaceSoft,
                  color: isSelected ? c.textInverse : c.text,
                  borderColor: isSelected ? c.primaryHover : c.border,
                  fontWeight: isSelected ? 700 : 400,
                  boxShadow: isSelected ? `0 2px 8px ${c.primary}30` : 'none',
                }}
              >
                <span className="text-xs">{opt.label}</span>
                <span className="text-[9px] mt-0.5" style={{ opacity: 0.7 }}>
                  {opt.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mood */}
      <div className="rounded-3xl p-5 space-y-3" style={cardStyle}>
        <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: c.text }}>
          <Smile className="w-4 h-4" style={{ color: c.primary }} />
          <span>Mood & Emotional Tone</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {moodOptions.map(opt => {
            const isSelected = mood === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setMood(isSelected ? null : opt.id)}
                aria-pressed={isSelected}
                className="px-3.5 py-2 rounded-xl text-xs font-medium border transition-all min-h-touch flex items-center gap-1.5"
                style={{
                  background: isSelected ? c.accent : c.surfaceSoft,
                  color: isSelected ? c.textInverse : c.text,
                  borderColor: isSelected ? c.accent : c.border,
                  fontWeight: isSelected ? 600 : 400,
                  boxShadow: isSelected ? `0 2px 8px ${c.accent}30` : 'none',
                }}
              >
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Energy */}
      <div className="rounded-3xl p-5 space-y-3" style={cardStyle}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: c.text }}>
            <BatteryCharging className="w-4 h-4" style={{ color: c.primary }} />
            <span>Energy & Vitality</span>
          </div>
          <span className="text-xs font-bold" style={{ color: c.primary }}>{energy || 3} / 5</span>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5].map(lvl => {
            const isSelected = energy === lvl;
            const labels = ['Exhausted', 'Low', 'Moderate', 'High', 'Vibrant'];
            return (
              <button
                key={lvl}
                type="button"
                onClick={() => setEnergy(lvl)}
                aria-pressed={isSelected}
                className="py-3 rounded-2xl border text-center transition-all min-h-touch flex flex-col items-center justify-center"
                style={{
                  background: isSelected ? c.successText : c.surfaceSoft,
                  color: isSelected ? c.textInverse : c.text,
                  borderColor: isSelected ? c.successText : c.border,
                  fontWeight: isSelected ? 700 : 400,
                  boxShadow: isSelected ? `0 2px 8px ${c.successText}30` : 'none',
                }}
              >
                <span className="text-sm font-bold">{lvl}</span>
                <span className="text-[9px] mt-0.5" style={{ opacity: 0.7 }}>
                  {labels[lvl - 1]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Symptoms */}
      <div className="rounded-3xl p-5 space-y-3" style={cardStyle}>
        <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: c.text }}>
          <Activity className="w-4 h-4" style={{ color: c.primary }} />
          <span>Physical Symptoms</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {symptomsList.map(sym => {
            const isSelected = selectedSymptoms.includes(sym.id);
            return (
              <button
                key={sym.id}
                type="button"
                onClick={() => toggleSymptom(sym.id)}
                aria-pressed={isSelected}
                className="px-3 py-2 rounded-xl text-xs font-medium border transition-all min-h-touch flex items-center gap-1.5"
                style={{
                  background: isSelected ? c.primarySoft : c.surfaceSoft,
                  color: isSelected ? c.primary : c.text,
                  borderColor: isSelected ? c.primary + '80' : c.border,
                  fontWeight: isSelected ? 600 : 400,
                }}
              >
                <span>{sym.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Notes */}
      <div className="rounded-3xl p-5 space-y-2" style={cardStyle}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: c.text }}>
            <Lock className="w-3.5 h-3.5" style={{ color: c.primary }} />
            <span>Private Daily Notes</span>
          </div>
          <span
            className="text-[10px] px-2 py-0.5 rounded-md font-medium"
            style={{ background: c.bgSecondary, color: c.textMuted }}
          >
            Never shared with partner or AI
          </span>
        </div>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Personal reflections, cravings, body temperature, or sleep notes..."
          rows={3}
          className="w-full p-3.5 rounded-2xl text-xs leading-relaxed cy-input"
        />
      </div>

      <div className="pt-2">
        <Button
          variant="primary"
          size="lg"
          loading={saving}
          onClick={handleSave}
          className="w-full shadow-soft"
          icon={<Check className="w-5 h-5" />}
        >
          {saveSuccess ? 'Saved to Journal!' : 'Save Daily Log'}
        </Button>
      </div>
    </div>
  );
};
