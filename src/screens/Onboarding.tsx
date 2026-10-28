import React, { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { useTheme } from '../lib/ThemeContext';
import { Button } from '../components/Button';
import { formatDateString, calculateCycleStats } from '../lib/cycleStats';
import { Sparkles, Calendar, Heart, Shield, ArrowRight, Check, Compass, ChevronLeft, Minus, Plus } from 'lucide-react';

export const OnboardingScreen: React.FC = () => {
  const { completeOnboarding } = useAuth();
  const { theme } = useTheme();
  const c = theme.colors;

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);

  const [lastPeriodStart, setLastPeriodStart] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 14);
    return formatDateString(d);
  });
  const [cycleLength, setCycleLength] = useState<number>(28);
  const [periodDuration, setPeriodDuration] = useState<number>(5);
  const [cyclesRegular, setCyclesRegular] = useState<boolean>(true);
  const [enableReminders] = useState<boolean>(true);

  const [primaryGoal, setPrimaryGoal] = useState<string>('understanding_cycle');
  const [preferredTone, setPreferredTone] = useState<string>('warm');

  const goals = [
    { id: 'understanding_cycle', label: 'Understanding my cycle rhythm', icon: Compass },
    { id: 'predict_period', label: 'Remembering when my period is due', icon: Calendar },
    { id: 'spot_patterns', label: 'Noticing mood & symptom patterns', icon: Sparkles },
    { id: 'partner_sharing', label: 'Sharing selected cues with my partner', icon: Heart },
  ];

  const tones = [
    { id: 'warm', label: 'Warm & nurturing', desc: 'Gentle, supportive, and grounded' },
    { id: 'calm', label: 'Calm & serene', desc: 'Quiet, peaceful, and balanced' },
    { id: 'minimal', label: 'Minimal & direct', desc: 'Concise, clean, and data-focused' },
    { id: 'encouraging', label: 'Encouraging & bright', desc: 'Positive, empowering, and uplifting' },
  ];

  const estimatedCycle = calculateCycleStats(
    lastPeriodStart ? [{ start_date: lastPeriodStart, end_date: null }] : [],
    new Date(),
    cycleLength,
    periodDuration
  );

  const handleFinishOnboarding = async () => {
    setLoading(true);
    try {
      await completeOnboarding({
        primary_goal: primaryGoal,
        preferred_tone: preferredTone,
        typical_cycle_length: cycleLength,
        typical_period_duration: periodDuration,
        cycles_regular: cyclesRegular,
        reminder_enabled: enableReminders,
        last_period_start: lastPeriodStart || null,
      });
    } catch (err) {
      console.error('Error completing onboarding:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-between p-4 sm:p-6 max-w-lg mx-auto relative z-10 transition-colors duration-400"
      style={{ backgroundColor: 'transparent' }}
    >
      {/* Stepper Header */}
      <div className="pt-4 flex items-center justify-between gap-2">
        {[1, 2, 3, 4].map(s => (
          <div
            key={s}
            className="h-2 flex-1 rounded-full transition-all duration-300"
            style={{
              backgroundColor: s <= step ? c.primary : c.borderSoft,
              boxShadow: s === step ? `0 0 10px ${c.primary}60` : 'none',
            }}
          />
        ))}
      </div>

      <div className="my-auto py-8">
        {step === 1 && (
          <div className="space-y-6 text-center animate-fade-in">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto shadow-card transform hover:scale-105 transition-all"
              style={{
                background: `linear-gradient(135deg, ${c.primarySoft}, ${c.accentSoft})`,
                color: c.primary,
                border: `1px solid ${c.border}`,
              }}
            >
              <Sparkles className="w-10 h-10" />
            </div>
            <div className="space-y-3">
              <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: c.text }}>
                Let's make CYTRACK yours.
              </h1>
              <p className="text-sm leading-relaxed max-w-sm mx-auto" style={{ color: c.textMuted }}>
                We'll ask a few gentle questions so your very first day provides immediate cycle clarity.
              </p>
            </div>

            <div
              className="p-5 rounded-3xl text-left space-y-2.5 text-xs shadow-soft backdrop-blur-sm"
              style={{
                background: c.cardBg,
                border: `1px solid ${c.cardBorder}`,
              }}
            >
              <div className="flex items-center gap-2 font-bold" style={{ color: c.text }}>
                <Shield className="w-4 h-4" style={{ color: c.primary }} />
                <span>Zero Speculation • Private by Design</span>
              </div>
              <p className="leading-relaxed" style={{ color: c.textMuted }}>
                Your biological data is stored directly on your personal device with deterministic mathematics, not sold to advertisers.
              </p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <span className="text-xs font-bold tracking-wider uppercase" style={{ color: c.primary }}>
                Step 1 of 3
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold mt-1" style={{ color: c.text }}>
                Your Cycle Baseline
              </h2>
              <p className="text-xs mt-1" style={{ color: c.textMuted }}>
                Give us your best estimate — you can adjust this anytime in Settings.
              </p>
            </div>

            <div
              className="space-y-5 p-6 rounded-[2rem] shadow-card backdrop-blur-sm"
              style={{
                background: c.cardBg,
                border: `1px solid ${c.cardBorder}`,
              }}
            >
              <div className="space-y-2">
                <label className="block text-xs font-bold" style={{ color: c.text }}>
                  When did your most recent period begin?
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={lastPeriodStart}
                    onChange={e => setLastPeriodStart(e.target.value)}
                    className="w-full min-h-touch px-4 rounded-2xl text-sm transition-all cy-input shadow-inner"
                    style={{
                      backgroundColor: c.surfaceSoft,
                      borderColor: c.border,
                      color: c.text,
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-bold" style={{ color: c.text }}>
                    Typical Cycle
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCycleLength(prev => Math.max(20, prev - 1))}
                      className="w-9 h-9 rounded-xl flex items-center justify-center border font-bold text-sm"
                      style={{ background: c.surfaceSoft, borderColor: c.border, color: c.text }}
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="flex-1 text-center font-bold text-sm" style={{ color: c.text }}>
                      {cycleLength} days
                    </span>
                    <button
                      type="button"
                      onClick={() => setCycleLength(prev => Math.min(50, prev + 1))}
                      className="w-9 h-9 rounded-xl flex items-center justify-center border font-bold text-sm"
                      style={{ background: c.surfaceSoft, borderColor: c.border, color: c.text }}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-[11px] block text-center" style={{ color: c.textMuted }}>
                    Avg: 28 days
                  </span>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold" style={{ color: c.text }}>
                    Bleed Duration
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPeriodDuration(prev => Math.max(2, prev - 1))}
                      className="w-9 h-9 rounded-xl flex items-center justify-center border font-bold text-sm"
                      style={{ background: c.surfaceSoft, borderColor: c.border, color: c.text }}
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="flex-1 text-center font-bold text-sm" style={{ color: c.text }}>
                      {periodDuration} days
                    </span>
                    <button
                      type="button"
                      onClick={() => setPeriodDuration(prev => Math.min(12, prev + 1))}
                      className="w-9 h-9 rounded-xl flex items-center justify-center border font-bold text-sm"
                      style={{ background: c.surfaceSoft, borderColor: c.border, color: c.text }}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-[11px] block text-center" style={{ color: c.textMuted }}>
                    Avg: 4-6 days
                  </span>
                </div>
              </div>

              <div
                className="pt-3 flex items-center justify-between"
                style={{ borderTop: `1px solid ${c.borderSoft}` }}
              >
                <div>
                  <span className="text-xs font-semibold" style={{ color: c.text }}>
                    Are your cycles regular?
                  </span>
                  <p className="text-[11px]" style={{ color: c.textMuted }}>
                    Refines estimation boundaries
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCyclesRegular(!cyclesRegular)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all"
                  style={{
                    backgroundColor: cyclesRegular ? c.primarySoft : c.surfaceSoft,
                    color: cyclesRegular ? c.primary : c.textMuted,
                    border: `1px solid ${cyclesRegular ? c.primary + '40' : c.border}`,
                  }}
                >
                  {cyclesRegular ? '✓ Regular' : 'Varies'}
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <span className="text-xs font-bold tracking-wider uppercase" style={{ color: c.primary }}>
                Step 2 of 3
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold mt-1" style={{ color: c.text }}>
                Focus & Daily Tone
              </h2>
              <p className="text-xs mt-1" style={{ color: c.textMuted }}>
                Personalize how CYTRACK communicates with you.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold" style={{ color: c.text }}>
                  What is your primary focus?
                </label>
                <div className="grid grid-cols-1 gap-2.5">
                  {goals.map(g => {
                    const Icon = g.icon;
                    const isSelected = primaryGoal === g.id;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setPrimaryGoal(g.id)}
                        className="flex items-center gap-3.5 p-3.5 rounded-2xl border text-left transition-all duration-200"
                        style={{
                          backgroundColor: isSelected ? c.primarySoft : c.cardBg,
                          borderColor: isSelected ? c.primary : c.cardBorder,
                          boxShadow: isSelected ? `0 4px 16px ${c.primary}20` : 'none',
                        }}
                      >
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors"
                          style={{
                            backgroundColor: isSelected ? c.primary : c.surfaceSoft,
                            color: isSelected ? c.textInverse : c.textMuted,
                          }}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold" style={{ color: isSelected ? c.primary : c.text }}>
                          {g.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold" style={{ color: c.text }}>
                  How should daily insights feel?
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {tones.map(t => {
                    const isSelected = preferredTone === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setPreferredTone(t.id)}
                        className="p-3.5 rounded-2xl border text-left transition-all duration-200"
                        style={{
                          backgroundColor: isSelected ? c.primarySoft : c.cardBg,
                          borderColor: isSelected ? c.primary : c.cardBorder,
                          boxShadow: isSelected ? `0 4px 16px ${c.primary}20` : 'none',
                        }}
                      >
                        <div className="text-xs font-bold" style={{ color: isSelected ? c.primary : c.text }}>
                          {t.label}
                        </div>
                        <div className="text-[10px] mt-1 line-clamp-2" style={{ color: c.textMuted }}>
                          {t.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 animate-fade-in text-center">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto shadow-card transform hover:scale-105 transition-all"
              style={{
                backgroundColor: c.successBg,
                color: c.successText,
                border: `1px solid ${c.successText}30`,
              }}
            >
              <Check className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h2 className="font-serif text-3xl font-bold" style={{ color: c.text }}>
                You're All Set!
              </h2>
              <p className="text-sm max-w-sm mx-auto" style={{ color: c.textMuted }}>
                Based on your baseline, your initial cycle map has been rendered below.
              </p>
            </div>

            <div
              className="p-5 rounded-[2rem] text-left space-y-3 shadow-card backdrop-blur-sm"
              style={{
                backgroundColor: c.cardBg,
                borderColor: c.cardBorder,
                borderWidth: '1px',
              }}
            >
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold" style={{ color: c.textMuted }}>
                  Estimated Current Cycle Day:
                </span>
                <span className="font-bold text-sm px-2.5 py-0.5 rounded-full" style={{ backgroundColor: c.primarySoft, color: c.primary }}>
                  Day {estimatedCycle.currentCycleDay || 1}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold" style={{ color: c.textMuted }}>
                  Typical Cycle Length:
                </span>
                <span className="font-bold" style={{ color: c.text }}>
                  {cycleLength} days
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold" style={{ color: c.textMuted }}>
                  Next Period Estimate:
                </span>
                <span className="font-bold" style={{ color: c.primary }}>
                  {estimatedCycle.estimatedNextPeriodStart || 'Calculated soon'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="pb-4 flex items-center gap-3">
        {step > 1 && (
          <Button
            variant="outline"
            size="lg"
            onClick={() => setStep((step - 1) as any)}
            className="flex-1"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            <span>Back</span>
          </Button>
        )}
        <Button
          variant="primary"
          size="lg"
          loading={loading}
          onClick={() => {
            if (step < 4) {
              setStep((step + 1) as any);
            } else {
              handleFinishOnboarding();
            }
          }}
          className="flex-1 shadow-soft"
        >
          <span>{step === 4 ? 'Enter CYTRACK' : 'Continue'}</span>
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};
