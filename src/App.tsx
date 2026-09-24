import { NavLink, Route, Routes } from 'react-router-dom'
import Today from './screens/Today'
import Calendar from './screens/Calendar'
import Log from './screens/Log'
import Insights from './screens/Insights'
import Partner from './screens/Partner'
import Settings from './screens/Settings'
import Auth from './screens/Auth'
import ResetPassword from './screens/ResetPassword'
import { HomeIcon, CalendarIcon, PlusIcon, ChartIcon, GearIcon } from './components/icons'
import { useAuth } from './lib/AuthContext'

const navItems = [
  { to: '/', label: 'Today', end: true, Icon: HomeIcon },
  { to: '/calendar', label: 'Calendar', Icon: CalendarIcon },
  { to: '/log', label: 'Log', Icon: PlusIcon },
  { to: '/insights', label: 'Insights', Icon: ChartIcon },
  { to: '/settings', label: 'Settings', Icon: GearIcon },
]

export default function App() {
  const { session, loading, isPasswordRecovery } = useAuth()

  if (loading) {
    return <div className="flex h-full items-center justify-center text-muted">Loading…</div>
  }

  if (isPasswordRecovery) {
    return <ResetPassword />
  }

  if (!session) {
    return <Auth />
  }

  return (
    <div className="mx-auto flex h-full max-w-md flex-col bg-surface">
      <main className="flex-1 overflow-y-auto pb-20">
        <Routes>
          <Route path="/" element={<Today />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/log" element={<Log />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/partner" element={<Partner />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>

      <nav
        className="fixed bottom-0 left-0 right-0 mx-auto flex max-w-md border-t border-border bg-surface"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {navItems.map(({ to, label, end, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex min-h-[44px] flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium ${
                isActive ? 'text-primary' : 'text-muted'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon aria-hidden className="h-6 w-6" filled={isActive} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
