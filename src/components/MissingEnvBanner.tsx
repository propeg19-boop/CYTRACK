import React, { useState } from 'react';
import { Info, X, ShieldCheck } from 'lucide-react';
import { getMissingEnvDetails } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';

export const MissingEnvBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);
  const { isDemoMode, enableDemoMode } = useAuth();
  const missing = getMissingEnvDetails();

  if (dismissed || missing.length === 0) return null;

  return (
    <aside aria-label="Configuration status" className="bg-sand-100 border-b border-sand-300 px-4 py-3 text-xs text-warm-800">
      <div className="max-w-4xl mx-auto flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <Info className="w-4 h-4 text-terracotta-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-warm-900">
              Supabase Configuration Notice {isDemoMode && '• Running in Local Demo Mode'}
            </p>
            <p className="text-warm-600">
              Missing frontend environment variables: <code className="bg-warm-200 px-1 py-0.5 rounded text-terracotta-800 font-mono">{missing.join(', ')}</code>.
              Set these in your <code className="bg-warm-200 px-1 py-0.5 rounded font-mono">.env</code> or Vercel dashboard.
            </p>
            {!isDemoMode && (
              <button
                onClick={enableDemoMode}
                className="mt-1 inline-flex items-center gap-1.5 font-medium text-terracotta-600 hover:text-terracotta-700 underline"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Enable offline demo mode to explore CYTRACK now
              </button>
            )}
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-warm-500 hover:text-warm-800 p-1 min-w-[28px] min-h-[28px] flex items-center justify-center rounded-lg hover:bg-sand-200"
          aria-label="Dismiss notice"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
