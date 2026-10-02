import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { ThemeProvider, useTheme } from './lib/ThemeContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { MissingEnvBanner } from './components/MissingEnvBanner';
import { BottomNav, ScreenTab } from './components/BottomNav';
import { AnimatedBackground } from './components/AnimatedBackground';
import { LoadingState } from './components/LoadingState';
import { AuthScreen } from './screens/Auth';
import { OnboardingScreen } from './screens/Onboarding';
import { TodayScreen } from './screens/Today';
import { CalendarScreen } from './screens/Calendar';
import { LogScreen } from './screens/Log';
import { InsightsScreen } from './screens/Insights';
import { SettingsScreen } from './screens/Settings';
import { PartnerScreen } from './screens/Partner';
import { ResetPasswordScreen } from './screens/ResetPassword';

const MainApp: React.FC = () => {
  const { user, loading, isOnboarded } = useAuth();
  const { theme } = useTheme();
  const [currentTab, setCurrentTab] = useState<ScreenTab>('today');
  const [isPartnerOpen, setIsPartnerOpen] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);

  useEffect(() => {
    if (window.location.hash.includes('type=recovery') || window.location.pathname === '/reset-password') {
      setIsResetPassword(true);
    }
  }, []);

  if (isResetPassword) {
    return <ResetPasswordScreen onDone={() => setIsResetPassword(false)} />;
  }

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: theme.colors.bg }}
      >
        <AnimatedBackground />
        <LoadingState message="Restoring your cycle rhythms..." />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <AnimatedBackground />
        <MissingEnvBanner />
        <AuthScreen />
      </>
    );
  }

  if (!isOnboarded) {
    return (
      <>
        <AnimatedBackground />
        <MissingEnvBanner />
        <OnboardingScreen />
      </>
    );
  }

  if (isPartnerOpen) {
    return (
      <div className="min-h-screen relative" style={{ backgroundColor: theme.colors.bg }}>
        <AnimatedBackground />
        <MissingEnvBanner />
        <div className="max-w-lg mx-auto pt-4 px-4 relative z-10">
          <button
            onClick={() => setIsPartnerOpen(false)}
            className="text-xs font-semibold px-3.5 py-2 rounded-xl border shadow-sm mb-2 min-h-touch flex items-center gap-1.5 transition-colors"
            style={{
              color: theme.colors.textMuted,
              background: theme.colors.surface,
              borderColor: theme.colors.border,
            }}
          >
            ← Back to Settings
          </button>
        </div>
        <PartnerScreen />
        <BottomNav
          currentTab={currentTab}
          onTabChange={tab => {
            setIsPartnerOpen(false);
            setCurrentTab(tab);
          }}
        />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col relative"
      style={{ backgroundColor: theme.colors.bg }}
    >
      <AnimatedBackground />
      <MissingEnvBanner />

      <main className="flex-1 w-full max-w-lg md:max-w-4xl mx-auto relative z-10">
        {currentTab === 'today' && <TodayScreen onNavigate={setCurrentTab} />}
        {currentTab === 'calendar' && <CalendarScreen onNavigate={setCurrentTab} />}
        {currentTab === 'log' && <LogScreen />}
        {currentTab === 'insights' && <InsightsScreen onNavigate={setCurrentTab} />}
        {currentTab === 'settings' && (
          <SettingsScreen
            onNavigate={setCurrentTab}
            onOpenPartner={() => setIsPartnerOpen(true)}
          />
        )}
      </main>

      <BottomNav currentTab={currentTab} onTabChange={setCurrentTab} />
    </div>
  );
};

export function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <MainApp />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
