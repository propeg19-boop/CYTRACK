import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) setError(error.message)
    else setDone(true)
  }

  if (done) {
    return (
      <div className="flex h-full flex-col justify-center p-6">
        <h1 className="text-2xl font-semibold text-ink">Password updated</h1>
        <p className="mt-1 text-sm text-muted">You're signed in with your new password.</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col justify-center p-6">
      <h1 className="text-2xl font-semibold text-ink">Set a new password</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
        <div>
          <label htmlFor="new-password" className="block text-sm font-medium text-ink">
            New password
          </label>
          <input
            id="new-password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 min-h-[44px] w-full rounded-xl border border-border px-3 text-base"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-primary">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="min-h-[44px] w-full rounded-xl bg-primary py-3 font-medium text-white shadow-sm disabled:opacity-60"
        >
          {loading ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </div>
  )
}
