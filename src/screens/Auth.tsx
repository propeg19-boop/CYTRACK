import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { useTheme } from '../lib/ThemeContext';
import { ThemeSwitcher } from '../components/ThemeSwitcher';
import { Button } from '../components/Button';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  UserCheck,
  RotateCcw,
  KeyRound,
  ShieldAlert,
} from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const {
    signIn,
    signUp,
    resetPassword,
    enableDemoMode,
    rememberedAccount,
    checkEmail,
    clearRemembered,
  } = useAuth();
  const { theme } = useTheme();
  const c = theme.colors;

  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgot, setIsForgot] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'error' | 'success' | 'info';
    text: string;
    actionLabel?: string;
    onAction?: () => void;
  } | null>(null);

  // Prefill email if remembered user exists
  useEffect(() => {
    if (rememberedAccount?.email) {
      setEmail(rememberedAccount.email);
    }
  }, [rememberedAccount]);

  // Real-time helper: If user is on Sign Up tab and enters an existing email, notify them immediately
  useEffect(() => {
    if (isSignUp && email.includes('@') && email.includes('.')) {
      if (checkEmail(email)) {
        setMessage({
          type: 'info',
          text: `You already created an account with ${email}! You only need to sign up once.`,
          actionLabel: 'Switch to Sign In',
          onAction: () => {
            setIsSignUp(false);
            setMessage(null);
          },
        });
        return;
      }
    }
  }, [email, isSignUp, checkEmail]);

  // Password strength calculation
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 8) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 1) return { score: 1, label: 'Fair (min 6 characters)', color: '#EF4444' };
    if (score === 2) return { score: 2, label: 'Good', color: '#F59E0B' };
    if (score >= 3) return { score: 3, label: 'Strong & secure', color: '#10B981' };
    return { score: 1, label: 'Weak', color: '#EF4444' };
  };

  const pwdStrength = isSignUp ? getPasswordStrength(password) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || (!isForgot && !password)) {
      setMessage({ type: 'error', text: 'Please fill in all required fields.' });
      return;
    }

    setLoading(true);
    try {
      if (isForgot) {
        const { error } = await resetPassword(cleanEmail);
        if (error) throw error;
        setMessage({
          type: 'success',
          text: 'Password reset instructions applied. You can now set your new password or sign in.',
        });
      } else if (isSignUp) {
        if (password.length < 6) {
          setMessage({ type: 'error', text: 'Password must be at least 6 characters for your privacy.' });
          setLoading(false);
          return;
        }

        const res = await signUp(cleanEmail, password, rememberMe);
        if (res.error) {
          if (res.isExisting) {
            setMessage({
              type: 'info',
              text: res.error.message,
              actionLabel: 'Sign In Now',
              onAction: () => {
                setIsSignUp(false);
                setMessage(null);
              },
            });
            setLoading(false);
            return;
          }
          throw res.error;
        }
        setMessage({ type: 'success', text: 'Welcome to CYTRACK! Your private cycle profile is ready.' });
      } else {
        const res = await signIn(cleanEmail, password, rememberMe);
        if (res.error) throw res.error;
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Authentication failed. Please verify credentials.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-center items-center px-4 py-8 relative z-10 transition-colors duration-500"
      style={{ backgroundColor: 'transparent' }}
    >
      <div className="w-full max-w-md space-y-6 animate-fade-in">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div
            className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto shadow-card transform hover:scale-105 transition-all duration-300"
            style={{
              background: `linear-gradient(135deg, ${c.primary}, ${c.primaryHover})`,
              boxShadow: `0 10px 25px -4px ${c.primary}50, 0 4px 12px -2px ${c.shadowColor}`,
            }}
          >
            <span className="font-serif font-bold text-3xl" style={{ color: c.textInverse }}>
              C
            </span>
          </div>
          <div>
            <div className="flex items-center justify-center gap-2">
              <h1 className="font-serif text-3xl font-bold tracking-tight" style={{ color: c.text }}>
                CYTRACK
              </h1>
              <span
                className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full"
                style={{ background: c.primarySoft, color: c.primary }}
              >
                Private
              </span>
            </div>
            <p className="text-sm mt-1" style={{ color: c.textMuted }}>
              Deterministic cycle tracking, body wisdom & wellness
            </p>
          </div>
        </div>

        {/* ─── Returning User Quick Welcome Card ─── */}
        {rememberedAccount && !isSignUp && !isForgot && (
          <div
            className="rounded-2xl p-4 flex items-center justify-between gap-3 border shadow-sm transition-all"
            style={{
              background: c.surfaceSoft,
              borderColor: `${c.primary}40`,
            }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                style={{ background: c.primary, color: c.textInverse }}
              >
                {rememberedAccount.email.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold truncate" style={{ color: c.text }}>
                    {rememberedAccount.email}
                  </p>
                  <UserCheck className="w-3.5 h-3.5 shrink-0" style={{ color: c.primary }} />
                </div>
                <p className="text-[11px]" style={{ color: c.textMuted }}>
                  Recognized device • Enter password to unlock
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                clearRemembered();
                setEmail('');
                setPassword('');
              }}
              className="text-[11px] font-medium underline shrink-0 px-2 py-1"
              style={{ color: c.textMuted }}
            >
              Switch
            </button>
          </div>
        )}

        {/* Auth Form Card */}
        <div
          className="rounded-[2rem] p-6 sm:p-8 space-y-6 backdrop-blur-md shadow-card transition-all duration-300"
          style={{
            background: c.cardBg,
            border: `1px solid ${c.cardBorder}`,
            boxShadow: `0 12px 40px -8px ${c.shadowColor}`,
          }}
        >
          {/* Tabs */}
          <div
            className="flex p-1 rounded-2xl relative"
            style={{ background: c.bgSecondary, border: `1px solid ${c.borderSoft}` }}
          >
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setIsForgot(false);
                setMessage(null);
              }}
              className="flex-1 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 text-center flex items-center justify-center gap-1.5"
              style={{
                background: !isSignUp && !isForgot ? c.cardBg : 'transparent',
                color: !isSignUp && !isForgot ? c.primary : c.textMuted,
                boxShadow: !isSignUp && !isForgot ? `0 2px 8px ${c.shadowColor}` : 'none',
              }}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(true);
                setIsForgot(false);
                setMessage(null);
              }}
              className="flex-1 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 text-center flex items-center justify-center gap-1.5"
              style={{
                background: isSignUp ? c.cardBg : 'transparent',
                color: isSignUp ? c.primary : c.textMuted,
                boxShadow: isSignUp ? `0 2px 8px ${c.shadowColor}` : 'none',
              }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Create Account</span>
            </button>
          </div>

          {/* Subtitle Reassurance */}
          <div className="flex items-center justify-between text-[11px] px-1">
            <span style={{ color: c.textMuted }}>
              {isForgot
                ? 'Reset your password securely'
                : isSignUp
                ? 'One-time registration • System remembers you'
                : 'Welcome back • Your biological data is secure'}
            </span>
            <span
              className="inline-flex items-center gap-1 font-semibold"
              style={{ color: c.primary }}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>On-device Vault</span>
            </span>
          </div>

          {/* Messages */}
          {message && (
            <div
              className="p-3.5 rounded-2xl flex flex-col gap-2 text-xs transition-all animate-fade-in"
              style={{
                background:
                  message.type === 'error'
                    ? c.dangerBg
                    : message.type === 'info'
                    ? c.primarySoft
                    : c.successBg,
                color:
                  message.type === 'error'
                    ? c.dangerText
                    : message.type === 'info'
                    ? c.primary
                    : c.successText,
                border: `1px solid ${
                  message.type === 'error'
                    ? c.dangerText + '30'
                    : message.type === 'info'
                    ? c.primary + '30'
                    : c.successText + '30'
                }`,
              }}
            >
              <div className="flex items-start gap-2.5">
                {message.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                ) : message.type === 'info' ? (
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <span className="flex-1 leading-relaxed">{message.text}</span>
              </div>
              {message.actionLabel && message.onAction && (
                <button
                  type="button"
                  onClick={message.onAction}
                  className="self-start mt-1 text-xs font-bold underline px-1 py-0.5 rounded transition-colors"
                  style={{ color: message.type === 'info' ? c.primary : c.text }}
                >
                  {message.actionLabel} →
                </button>
              )}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold" style={{ color: c.text }}>
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  autoComplete="email"
                  required
                  className="w-full min-h-touch px-4 pl-11 rounded-2xl text-sm transition-all cy-input shadow-inner"
                  style={{
                    backgroundColor: c.surfaceSoft,
                    borderColor: c.border,
                    color: c.text,
                  }}
                />
                <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2" style={{ color: c.textMuted }} />
              </div>
            </div>

            {!isForgot && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold" style={{ color: c.text }}>
                    Password
                  </label>
                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgot(true);
                        setMessage(null);
                      }}
                      className="text-xs font-semibold hover:underline"
                      style={{ color: c.primary }}
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    required
                    className="w-full min-h-touch px-4 pl-11 pr-11 rounded-2xl text-sm transition-all cy-input shadow-inner"
                    style={{
                      backgroundColor: c.surfaceSoft,
                      borderColor: c.border,
                      color: c.text,
                    }}
                  />
                  <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2" style={{ color: c.textMuted }} />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:opacity-80 transition-opacity"
                    style={{ color: c.textMuted }}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password strength meter for Sign Up */}
                {isSignUp && password && pwdStrength && (
                  <div className="pt-1 space-y-1">
                    <div className="h-1.5 w-full bg-black/10 dark:bg-white/10 rounded-full overflow-hidden flex gap-1">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${(pwdStrength.score / 3) * 100}%`,
                          backgroundColor: pwdStrength.color,
                        }}
                      />
                    </div>
                    <p className="text-[10px]" style={{ color: pwdStrength.color }}>
                      Strength: {pwdStrength.label}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Remember Me Checkbox */}
            {!isForgot && (
              <label className="flex items-center gap-2.5 pt-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border text-primary focus:ring-primary rounded-md"
                  style={{ accentColor: c.primary }}
                />
                <span className="text-xs font-medium" style={{ color: c.textMuted }}>
                  Remember me on this device (One-time sign up)
                </span>
              </label>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full mt-3 shadow-soft py-3 text-sm font-bold flex items-center justify-center gap-2 transform active:scale-[0.98] transition-transform"
            >
              <span>{isForgot ? 'Send Reset Link' : isSignUp ? 'Create My Cycle Profile' : 'Sign In to CYTRACK'}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          {isForgot && (
            <button
              type="button"
              onClick={() => {
                setIsForgot(false);
                setMessage(null);
              }}
              className="w-full text-center text-xs font-semibold py-2 flex items-center justify-center gap-1.5 hover:underline"
              style={{ color: c.textMuted }}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </button>
          )}

          {/* Quick Instant Offline Demo */}
          <div className="pt-4 text-center space-y-2" style={{ borderTop: `1px solid ${c.border}` }}>
            <button
              type="button"
              onClick={enableDemoMode}
              className="w-full inline-flex items-center justify-center gap-2 text-xs font-semibold py-2.5 px-4 rounded-xl transition-all duration-200 border hover:opacity-90 active:scale-[0.99]"
              style={{
                color: c.primary,
                background: c.primarySoft,
                borderColor: `${c.primary}30`,
              }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Explore Instant Offline Guest Demo</span>
            </button>
            <p className="text-[11px]" style={{ color: c.textMuted }}>
              Zero setup required. Your cycle rhythms stay on your personal device.
            </p>
          </div>
        </div>

        {/* Theme Switcher */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-[11px] font-semibold tracking-wide uppercase" style={{ color: c.textMuted }}>
            Choose Your Season Theme
          </p>
          <ThemeSwitcher compact />
        </div>

        <p className="text-center text-xs max-w-xs mx-auto leading-relaxed" style={{ color: c.textMuted }}>
          Your cycle data is stored privately with deterministic algorithms. We never share or sell personal information.
        </p>
      </div>
    </div>
  );
};
