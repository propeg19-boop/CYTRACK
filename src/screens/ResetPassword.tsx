import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Button } from '../components/Button';
import { Lock, CheckCircle, AlertCircle } from 'lucide-react';

interface ResetPasswordProps {
  onDone: () => void;
}

export const ResetPasswordScreen: React.FC<ResetPasswordProps> = ({ onDone }) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
      }
      setMessage({ type: 'success', text: 'Your password has been successfully updated!' });
      setTimeout(onDone, 2000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update password' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-warm-100 flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-warm-200 shadow-card space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-terracotta-100 text-terracotta-600 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-warm-900">Set New Password</h1>
          <p className="text-xs text-warm-600">Enter a secure new password for your CYTRACK account.</p>
        </div>

        {message && (
          <div
            className={`p-3 rounded-2xl text-xs flex items-center gap-2 ${
              message.type === 'error'
                ? 'bg-red-50 text-red-800 border border-red-200'
                : 'bg-sage-50 text-sage-800 border border-sage-200'
            }`}
          >
            {message.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-warm-700">New Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full min-h-touch px-4 rounded-2xl border border-warm-300 focus:border-terracotta-500 bg-warm-50/50 text-warm-900 text-sm"
            />
          </div>

          <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
            Update Password
          </Button>
        </form>

        <button
          onClick={onDone}
          className="w-full text-center text-xs text-warm-500 hover:text-warm-800 font-medium"
        >
          Return to CYTRACK
        </button>
      </div>
    </div>
  );
};
