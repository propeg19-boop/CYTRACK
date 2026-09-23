import { useAuth } from '../lib/AuthContext'

export default function Settings() {
  const { session, signOut } = useAuth()

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-ink">Settings</h1>
      <p className="mt-1 text-sm text-muted">Signed in as {session?.user.email}</p>

      <button
        onClick={signOut}
        className="mt-6 min-h-[44px] w-full rounded-xl border border-border py-3 font-medium text-ink active:bg-primary-soft"
      >
        Sign out
      </button>

      <p className="mt-6 text-sm text-muted">Data export and delete account — Phase 9.</p>
    </div>
  )
}
