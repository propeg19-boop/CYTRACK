import React from 'react';
import { Sun, Calendar as CalendarIcon, PlusCircle, LineChart, Settings as SettingsIcon } from 'lucide-react';
import { useTheme } from '../lib/ThemeContext';

export type ScreenTab = 'today' | 'calendar' | 'log' | 'insights' | 'settings';

interface BottomNavProps {
  currentTab: ScreenTab;
  onTabChange: (tab: ScreenTab) => void;
  isPeriodActive?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange, isPeriodActive }) => {
  const { theme } = useTheme();
  const c = theme.colors;

  const tabs = [
    { id: 'today' as ScreenTab, label: 'Today', icon: Sun },
    { id: 'calendar' as ScreenTab, label: 'Calendar', icon: CalendarIcon },
    { id: 'log' as ScreenTab, label: 'Log', icon: PlusCircle, highlight: true },
    { id: 'insights' as ScreenTab, label: 'Insights', icon: LineChart },
    { id: 'settings' as ScreenTab, label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav
        aria-label="Main Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 backdrop-blur-md px-2 pb-safe"
        style={{
          background: c.navBg,
          borderTop: `1px solid ${c.navBorder}`,
        }}
      >
        <div className="flex items-center justify-around h-16 max-w-md mx-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;

            if (tab.highlight) {
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  aria-label="Daily Log"
                  aria-current={isActive ? 'page' : undefined}
                  className="relative -top-3 flex flex-col items-center justify-center min-w-touch min-h-touch p-2 group focus:outline-none"
                >
                  <div
                    className="w-13 h-13 rounded-full flex items-center justify-center shadow-card transition-all duration-300"
                    style={{
                      background: isActive ? c.primary : (theme.isDark ? c.surface : c.text),
                      color: c.textInverse,
                      transform: isActive ? 'scale(1.05)' : 'scale(1)',
                      boxShadow: isActive ? `0 0 20px ${c.primary}40, 0 4px 12px ${c.shadowColor}` : `0 4px 12px ${c.shadowColor}`,
                    }}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <span
                    className="text-[10px] font-medium mt-1"
                    style={{ color: isActive ? c.primary : c.textMuted, fontWeight: isActive ? 600 : 500 }}
                  >
                    {tab.label}
                  </span>
                </button>
              );
            }

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                aria-label={tab.label}
                aria-current={isActive ? 'page' : undefined}
                className="flex flex-col items-center justify-center min-w-touch min-h-touch flex-1 py-1 rounded-xl transition-all focus:outline-none"
              >
                <div className="relative">
                  <Icon
                    className="w-5 h-5 transition-transform duration-200"
                    style={{
                      color: isActive ? c.primary : c.textMuted,
                      transform: isActive ? 'scale(1.1)' : 'scale(1)',
                    }}
                  />
                  {tab.id === 'today' && isPeriodActive && (
                    <span
                      className="absolute -top-1 -right-1 w-2 h-2 rounded-full"
                      style={{ background: c.primary, boxShadow: `0 0 0 2px ${c.navBg}` }}
                    />
                  )}
                </div>
                <span
                  className="text-[11px] mt-1 transition-colors"
                  style={{ color: isActive ? c.primary : c.textMuted, fontWeight: isActive ? 600 : 400 }}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Desktop Top Header Navigation */}
      <header
        className="hidden md:block sticky top-0 z-40 backdrop-blur-md"
        style={{
          background: c.navBg,
          borderBottom: `1px solid ${c.navBorder}`,
        }}
      >
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center font-serif font-bold text-lg shadow-soft"
              style={{ background: c.primary, color: c.textInverse }}
            >
              C
            </div>
            <span className="font-serif text-xl font-bold tracking-tight" style={{ color: c.text }}>
              CYTRACK
            </span>
          </div>
          <nav
            aria-label="Desktop Navigation"
            className="flex items-center gap-1 p-1.5 rounded-2xl border"
            style={{ background: c.bgSecondary, borderColor: c.border }}
          >
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className="min-h-touch px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-all"
                  style={{
                    background: isActive ? c.surface : 'transparent',
                    color: isActive ? c.primary : c.textMuted,
                    boxShadow: isActive ? `0 4px 20px -2px ${c.shadowColor}` : 'none',
                  }}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>
    </>
  );
};
