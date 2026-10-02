import React, { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { useTheme } from '../lib/ThemeContext';
import { ThemeSwitcher } from '../components/ThemeSwitcher';
import { Button } from '../components/Button';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const { signIn, signUp, resetPassword, enableDemoMode } = useAuth();
  const { theme } = useTheme();
  const c = theme.colors;
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgot, setIsForgot] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!email || (!isForgot && !password)) {
      setMessage({ type: 'error', text: 'Please fill in all required fields.' });
      return;
    }

    setLoading(true);
    try {
      if (isForgot) {
        const { error } = await resetPassword(email);
        if (error) throw error;
        setMessage({ type: 'success', text: 'Password reset link sent to your email.' });
      } else if (isSignUp) {
        if (password.length < 6) {
          setMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
          setLoading(false);
          return;
        }
        const { error } = await signUp(email, password);
        if (error) throw error;
        setMessage({ type: 'success', text: 'Account created! Welcome to CYTRACK.' });
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Authentication failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-center items-center px-4 py-8 relative z-10"
      style={{ backgroundColor: 'transparent' }}
    >
      <div className="w-full max-w-md space-y-6">
        {/* Brand */}
        <div className="text-center space-y-3">
          <div
            className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto"
            style={{
              background: c.primary,
              boxShadow: `0 8px 30px -4px ${c.primary}40, 0 4px 12px -2px ${c.shadowColor}`,
            }}
          >
            <span className="font-serif font-bold text-3xl" style={{ color: c.textInverse }}>C</span>
          </div>
          <div>
            <h1 className="font-serif text-3xl font-bold tracking-tight" style={{ color: c.text }}>CYTRACK</h1>
            <p className="text-sm mt-1" style={{ color: c.textMuted }}>
              Private, deterministic cycle tracking & wellness insights
            </p>
          </div>
        </div>

        {/* Auth Form Card */}
        <div
          className="rounded-3xl p-6 sm:p-8 space-y-6 backdrop-blur-sm"
          style={{
            background: c.cardBg,
            border: `1px solid ${c.cardBorder}`,
            boxShadow: `0 8px 30px -4px ${c.shadowColor}`,
          }}
        >
          {/* Tabs */}
          <div className="flex" style={{ borderBottom: `1px solid ${c.border}` }}>
            <button
              onClick={() => {
                setIsSignUp(false);
                setIsForgot(false);
                setMessage(null);
              }}
              className="flex-1 pb-3 text-sm font-semibold text-center transition-colors min-h-touch"
              style={{
                color: !isSignUp && !isForgot ? c.primary : c.textMuted,
                borderBottom: !isSignUp && !isForgot ? `2px solid ${c.primary}` : '2px solid transparent',
              }}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setIsSignUp(true);
                setIsForgot(false);
                setMessage(null);
              }}
              className="flex-1 pb-3 text-sm font-semibold text-center transition-colors min-h-touch"
              style={{
                color: isSignUp ? c.primary : c.textMuted,
                borderBottom: isSignUp ? `2px solid ${c.primary}` : '2px solid transparent',
              }}
            >
              Create Account
            </button>
          </div>

          {/* Messages */}
          {message && (
            <div
              className="p-3.5 rounded-2xl flex items-start gap-2.5 text-xs"
              style={{
                background: message.type === 'error' ? c.dangerBg : c.successBg,
                color: message.type === 'error' ? c.dangerText : c.successText,
                border: `1px solid ${message.type === 'error' ? c.dangerText + '30' : c.successText + '30'}`,
              }}
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{message.text}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold" style={{ color: c.text }}>Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full min-h-touch px-4 pl-11 rounded-2xl text-sm transition-colors cy-input"
                />
                <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2" style={{ color: c.textMuted }} />
              </div>
            </div>

            {!isForgot && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold" style={{ color: c.text }}>Password</label>
                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgot(true);
                        setMessage(null);
                      }}
                      className="text-xs font-medium"
                      style={{ color: c.primary }}
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full min-h-touch px-4 pl-11 pr-11 rounded-2xl text-sm transition-colors cy-input"
                  />
                  <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2" style={{ color: c.textMuted }} />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1"
                    style={{ color: c.textMuted }}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full mt-2"
            >
              {isForgot ? 'Send Reset Link' : isSignUp ? 'Begin Onboarding' : 'Sign In'}
            </Button>
          </form>

          {isForgot && (
            <button
              onClick={() => setIsForgot(false)}
              className="w-full text-center text-xs font-medium"
              style={{ color: c.textMuted }}
            >
              Back to Sign In
            </button>
          )}

          <div className="pt-4 text-center space-y-2" style={{ borderTop: `1px solid ${c.border}` }}>
            <button
              onClick={enableDemoMode}
              className="inline-flex items-center gap-2 text-xs font-semibold py-2.5 px-4 rounded-xl transition-all"
              style={{
                color: c.primary,
                background: c.primarySoft,
              }}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Explore Instant Offline Demo</span>
            </button>
            <p className="text-[11px]" style={{ color: c.textMuted }}>
              Zero setup required. Your data is stored locally in your browser.
            </p>
          </div>
        </div>

        {/* Theme Switcher - compact on auth page */}
        <div className="flex justify-center">
          <ThemeSwitcher compact />
        </div>

        <p className="text-center text-xs max-w-xs mx-auto" style={{ color: c.textMuted }}>
          Your cycle information is strictly private. We never share your data with advertisers.
        </p>
      </div>
    </div>
  );
};
