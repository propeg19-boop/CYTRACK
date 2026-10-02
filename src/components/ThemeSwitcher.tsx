/**
 * CYTRACK — Theme Switcher Component
 * 
 * A beautiful inline theme picker with live preview swatches,
 * animated selection indicator, and smooth transitions.
 */

import React from 'react';
import { useTheme, THEME_LIST } from '../lib/ThemeContext';
import { Palette, Check } from 'lucide-react';

interface ThemeSwitcherProps {
  compact?: boolean;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ compact = false }) => {
  const { themeId, setTheme, theme } = useTheme();

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {THEME_LIST.map(t => (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            title={t.name}
            className="relative w-9 h-9 rounded-xl transition-all duration-300 flex items-center justify-center border-2"
            style={{
              background: `linear-gradient(135deg, ${t.colors.primary}, ${t.colors.accent})`,
              borderColor: themeId === t.id ? t.colors.primary : 'transparent',
              transform: themeId === t.id ? 'scale(1.15)' : 'scale(1)',
              boxShadow: themeId === t.id ? `0 0 12px ${t.colors.primary}40` : 'none',
            }}
          >
            {themeId === t.id && (
              <Check className="w-4 h-4 drop-shadow-md" style={{ color: t.colors.textInverse }} />
            )}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div
      className="rounded-3xl p-6 border space-y-4"
      style={{
        background: theme.colors.cardBg,
        borderColor: theme.colors.cardBorder,
        boxShadow: `0 8px 30px -4px ${theme.colors.shadowColor}`,
      }}
    >
      <div className="flex items-center gap-2">
        <Palette className="w-4 h-4" style={{ color: theme.colors.primary }} />
        <h2 className="text-sm font-semibold" style={{ color: theme.colors.text }}>
          Theme & Ambiance
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {THEME_LIST.map(t => {
          const isActive = themeId === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className="relative rounded-2xl p-3 text-left transition-all duration-300 border-2 group overflow-hidden"
              style={{
                borderColor: isActive ? t.colors.primary : theme.colors.border,
                background: isActive ? t.colors.primarySoft : theme.colors.surface,
                boxShadow: isActive ? `0 0 20px ${t.colors.primary}20` : 'none',
              }}
            >
              {/* Mini gradient preview */}
              <div
                className="w-full h-12 rounded-xl mb-2.5 transition-transform duration-300 group-hover:scale-[1.02]"
                style={{
                  background: `linear-gradient(135deg, ${t.colors.gradientFrom}, ${t.colors.primary}40, ${t.colors.accent}60)`,
                  boxShadow: `inset 0 -8px 16px ${t.colors.bg}80`,
                }}
              >
                {/* Floating mini dots preview */}
                <div className="relative w-full h-full overflow-hidden rounded-xl">
                  {t.particles.colors.slice(0, 4).map((c, i) => (
                    <div
                      key={i}
                      className="absolute rounded-full"
                      style={{
                        width: 4 + i * 2 + 'px',
                        height: 4 + i * 2 + 'px',
                        background: c,
                        opacity: 0.5 + i * 0.1,
                        left: 10 + i * 20 + '%',
                        top: 20 + (i % 2) * 35 + '%',
                        animation: `float ${2 + i * 0.5}s ease-in-out infinite alternate`,
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{t.emoji}</span>
                    <span
                      className="text-xs font-semibold"
                      style={{ color: isActive ? t.colors.primary : theme.colors.text }}
                    >
                      {t.name}
                    </span>
                  </div>
                  <p
                    className="text-[10px] mt-0.5"
                    style={{ color: theme.colors.textMuted }}
                  >
                    {t.description}
                  </p>
                </div>

                {isActive && (
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: t.colors.primary }}
                  >
                    <Check className="w-3.5 h-3.5" style={{ color: t.colors.textInverse }} />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
