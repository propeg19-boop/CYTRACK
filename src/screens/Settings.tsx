import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { isPushSupported, subscribeToPush, unsubscribeFromPush } from '../lib/push'
import { exportUserData } from '../lib/exportData'
import { supabase } from '../lib/supabase'
import Toggle from '../components/Toggle'

export default function Settings() {
  const { session, signOut } = useAuth()
  const [remindersOn, setRemindersOn] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supported = isPushSupported()

  useEffect(() => {
    if (!supported) return
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setRemindersOn(sub !== null))
  }, [supported])

  async function toggleReminders() {
    if (!session) return
    setBusy(true)
    setError(null)
    try {
      if (remindersOn) {
        await unsubscribeFromPush(session.user.id)
        setRemindersOn(false)
      } else {
        if (Notification.permission === 'denied') {
          setError('Notifications are blocked for this site in your browser settings.')
          return
        }
        await subscribeToPush(session.user.id)
        setRemindersOn(true)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update reminders.')
    } finally {
      setBusy(false)
    }
  }

  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function handleExport() {
    setExporting(true)
    setExportError(null)
    try {
      await exportUserData()
    } catch (e) {
      setExportError(e instanceof Error ? e.message : 'Export failed.')
    } finally {
      setExporting(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    setDeleteError(null)
    const { error } = await supabase.functions.invoke('delete-account')
    if (error) {
      setDeleteError(error.message)
      setDeleting(false)
      return
    }
    // Account is gone server-side — the local session is now invalid.
    // signOut() clears it client-side so the app falls back to the Auth screen.
    await signOut()
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-ink">Settings</h1>
      <p className="mt-1 text-sm text-muted">Signed in as {session?.user.email}</p>

      <div className="mt-6 flex items-center justify-between rounded-xl border border-border p-4">
        <div>
          <p className="text-sm font-medium text-ink">Period reminders</p>
          <p className="mt-0.5 text-xs text-muted">
            {supported ? 'A heads-up around your predicted period date.' : 'Not supported on this browser.'}
          </p>
        </div>
        <Toggle checked={remindersOn} onChange={toggleReminders} label="Period reminders" disabled={!supported || busy} />
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-primary">
          {error}
        </p>
      )}

      <Link
        to="/partner"
        className="mt-6 flex min-h-[44px] w-full items-center justify-between rounded-xl border border-border px-4 text-ink"
      >
        Partner sharing
        <span aria-hidden className="text-muted">
          ›
        </span>
      </Link>

      <button
        onClick={signOut}
        className="mt-6 min-h-[44px] w-full rounded-xl border border-border py-3 font-medium text-ink active:bg-primary-soft"
      >
        Sign out
      </button>

      <button
        onClick={handleExport}
        disabled={exporting}
        className="mt-6 min-h-[44px] w-full rounded-xl border border-border py-3 font-medium text-ink active:bg-primary-soft disabled:opacity-60"
      >
        {exporting ? 'Preparing…' : 'Export my data'}
      </button>
      {exportError && (
        <p role="alert" className="mt-2 text-sm text-primary">
          {exportError}
        </p>
      )}

      <div className="mt-8 rounded-xl border border-primary p-4">
        <p className="text-sm font-medium text-primary">Delete account</p>
        <p className="mt-1 text-xs text-muted">
          Permanently deletes your account and all your data. This can't be undone.
        </p>
        <label htmlFor="confirm-delete" className="mt-3 block text-xs text-muted">
          Type DELETE to confirm
        </label>
        <input
          id="confirm-delete"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          className="mt-1 min-h-[44px] w-full rounded-lg border border-border px-3"
        />
        <button
          onClick={handleDelete}
          disabled={confirmText !== 'DELETE' || deleting}
          className="mt-3 min-h-[44px] w-full rounded-xl bg-primary py-3 font-medium text-white disabled:opacity-40"
        >
          {deleting ? 'Deleting…' : 'Permanently delete my account'}
        </button>
        {deleteError && (
          <p role="alert" className="mt-2 text-sm text-primary">
            {deleteError}
          </p>
        )}
      </div>
    </div>
  )
}
