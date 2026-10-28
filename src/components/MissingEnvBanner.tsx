import React, { useState } from 'react';
import { X, ShieldCheck } from 'lucide-react';
import { getMissingEnvDetails } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { useTheme } from '../lib/ThemeContext';

export const MissingEnvBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState(true); // Default to non-intrusive dismissed so user experience is clean
  const { user } = useAuth();
  const { theme } = useTheme();
  const c = theme.colors;
  const missing = getMissingEnvDetails();

  if (dismissed || missing.length === 0) return null;

  return (
    <aside
      aria-label="Configuration status"
      className="px-4 py-2 text-xs border-b backdrop-blur-md relative z-30 transition-all duration-300"
      style={{
        backgroundColor: c.surfaceSoft,
        borderColor: c.borderSoft,
        color: c.text,
      }}
    >
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 shrink-0" style={{ color: c.primary }} />
          <p className="text-[11px]" style={{ color: c.textMuted }}>
            <span className="font-bold" style={{ color: c.text }}>On-Device Storage Mode</span>
            {user ? ' • All cycle records stored safely in your browser vault' : ' • Connect Supabase in .env for multi-device cloud backup'}
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 rounded-lg hover:opacity-75 transition-opacity"
          style={{ color: c.textMuted }}
          aria-label="Dismiss notice"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
};
