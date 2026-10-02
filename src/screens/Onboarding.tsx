import React, { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { Button } from '../components/Button';
import { formatDateString, calculateCycleStats } from '../lib/cycleStats';
import { Sparkles, Calendar, Heart, Shield, ArrowRight, Check, Compass } from 'lucide-react';

export const OnboardingScreen: React.FC = () => {
  const { completeOnboarding } = useAuth();
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
    <div className="min-h-screen bg-warm-100 flex flex-col justify-between p-4 sm:p-6 max-w-lg mx-auto">
      <div className="pt-4 flex items-center justify-between gap-2">
        {[1, 2, 3, 4].map(s => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              s <= step ? 'bg-terracotta-500' : 'bg-warm-200'
            }`}
          />
        ))}
      </div>

      <div className="my-auto py-8">
        {step === 1 && (
          <div className="space-y-6 text-center animate-fade-in">
            <div className="w-20 h-20 rounded-3xl bg-terracotta-100 text-terracotta-600 flex items-center justify-center mx-auto shadow-card">
              <Sparkles className="w-10 h-10" />
            </div>
            <div className="space-y-3">
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-warm-900 tracking-tight">
                Let's make CYTRACK yours.
              </h1>
              <p className="text-warm-600 text-base leading-relaxed max-w-sm mx-auto">
                We'll ask a few simple questions so your very first day inside the app provides immediate clarity.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white/70 border border-warm-200 text-left space-y-2 text-xs text-warm-700">
              <div className="flex items-center gap-2 font-semibold text-warm-900">
                <Shield className="w-4 h-4 text-terracotta-500" />
                <span>Privacy First by Design</span>
              </div>
              <p>
                Your biological data is strictly yours. We use deterministic mathematics for cycle estimates, not speculative AI.
              </p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <span className="text-xs font-semibold text-terracotta-600 tracking-wider uppercase">Step 1 of 3</span>
              <h2 className="font-serif text-2xl font-bold text-warm-900 mt-1">Your Cycle Baseline</h2>
              <p className="text-xs text-warm-600">Give us your best estimate — you can always adjust this later.</p>
            </div>

            <div className="space-y-4 bg-white p-6 rounded-3xl border border-warm-200 shadow-soft">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-warm-800">
                  When did your most recent period begin?
                </label>
                <input
                  type="date"
                  value={lastPeriodStart}
                  onChange={e => setLastPeriodStart(e.target.value)}
                  className="w-full min-h-touch px-4 rounded-2xl border border-warm-300 focus:border-terracotta-500 bg-warm-50/50 text-warm-900 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-warm-800">
                    Typical Cycle (Days)
                  </label>
                  <input
                    type="number"
                    min="20"
                    max="50"
                    value={cycleLength}
                    onChange={e => setCycleLength(Number(e.target.value))}
                    className="w-full min-h-touch px-4 rounded-2xl border border-warm-300 focus:border-terracotta-500 bg-warm-50/50 text-warm-900 text-sm font-medium"
                  />
                  <span className="text-[11px] text-warm-500">Average is 28 days</span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-warm-800">
                    Period Bleed (Days)
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="10"
                    value={periodDuration}
                    onChange={e => setPeriodDuration(Number(e.target.value))}
                    className="w-full min-h-touch px-4 rounded-2xl border border-warm-300 focus:border-terracotta-500 bg-warm-50/50 text-warm-900 text-sm font-medium"
                  />
                  <span className="text-[11px] text-warm-500">Average is 4-6 days</span>
                </div>
              </div>

              <div className="pt-2 border-t border-warm-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-warm-900">Are your cycles regular?</span>
                  <p className="text-[11px] text-warm-500">Helps refine estimation ranges</p>
                </div>
                <button
                  type="button"
                  onClick={() => setCyclesRegular(!cyclesRegular)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                    cyclesRegular
                      ? 'bg-sage-100 text-sage-700 border border-sage-200'
                      : 'bg-warm-100 text-warm-600 border border-warm-200'
                  }`}
                >
                  {cyclesRegular ? 'Regular' : 'Irregular / Varies'}
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <span className="text-xs font-semibold text-terracotta-600 tracking-wider uppercase">Step 2 of 3</span>
              <h2 className="font-serif text-2xl font-bold text-warm-900 mt-1">Tone & Focus</h2>
              <p className="text-xs text-warm-600">Personalize how CYTRACK supports you day-to-day.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-warm-800">What is your primary goal?</label>
                <div className="grid grid-cols-1 gap-2.5">
                  {goals.map(g => {
                    const Icon = g.icon;
                    const isSelected = primaryGoal === g.id;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setPrimaryGoal(g.id)}
                        className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all min-h-touch ${
                          isSelected
                            ? 'bg-terracotta-50/80 border-terracotta-400 text-terracotta-900 shadow-soft'
                            : 'bg-white border-warm-200 text-warm-700 hover:border-warm-300'
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-terracotta-500 text-white' : 'bg-warm-100 text-warm-600'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-medium">{g.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="block text-xs font-semibold text-warm-800">How should CYTRACK feel?</label>
                <div className="grid grid-cols-2 gap-2">
                  {tones.map(t => {
                    const isSelected = preferredTone === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setPreferredTone(t.id)}
                        className={`p-3 rounded-2xl border text-left transition-all min-h-touch ${
                          isSelected
                            ? 'bg-terracotta-50/80 border-terracotta-400 text-terracotta-900 shadow-soft'
                            : 'bg-white border-warm-200 text-warm-700 hover:border-warm-300'
                        }`}
                      >
                        <div className="text-xs font-semibold">{t.label}</div>
                        <div className="text-[10px] text-warm-500 mt-0.5">{t.desc}</div>
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
            <div className="w-16 h-16 rounded-3xl bg-sage-100 text-sage-600 flex items-center justify-center mx-auto shadow-card">
              <Check className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="font-serif text-3xl font-bold text-warm-900">You're all set.</h2>
              <p className="text-xs text-warm-600">Here is your initial cycle baseline:</p>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-warm-200 shadow-card space-y-4 text-left">
              <div className="flex items-center justify-between border-b border-warm-100 pb-3">
                <span className="text-xs text-warm-500">Current Position</span>
                <span className="text-sm font-bold text-terracotta-600">
                  Day {estimatedCycle.currentCycleDay || 1} of Cycle
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-warm-100 pb-3">
                <span className="text-xs text-warm-500">Estimated Next Period</span>
                <span className="text-sm font-semibold text-warm-900">
                  {estimatedCycle.estimatedPeriodWindow
                    ? `${estimatedCycle.estimatedPeriodWindow.start} to ${estimatedCycle.estimatedPeriodWindow.end}`
                    : 'Upcoming in approx. 2 weeks'}
                </span>
              </div>

              <div className="p-3 bg-warm-50 rounded-2xl text-[11px] text-warm-600 space-y-1">
                <p className="font-medium text-warm-800">How this estimation works:</p>
                <p>
                  Computed deterministically from your {cycleLength}-day baseline. As you log future cycles, CYTRACK will continuously refine precision based on your actual history.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="pb-4 flex items-center gap-3">
        {step > 1 && (
          <Button
            variant="outline"
            size="lg"
            onClick={() => setStep((step - 1) as any)}
            className="flex-1"
          >
            Back
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
          className="flex-1"
          icon={<ArrowRight className="w-4 h-4" />}
        >
          {step === 4 ? 'Enter CYTRACK' : 'Continue'}
        </Button>
      </div>
    </div>
  );
};
