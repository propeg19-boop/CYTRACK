import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'

type Mode = 'sign-in' | 'sign-up' | 'forgot'

const titles: Record<Mode, string> = {
  'sign-in': 'Welcome back',
  'sign-up': 'Create your account',
  forgot: 'Reset your password',
}

export default function Auth() {
  const [mode, setMode] = useState<Mode>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  function switchMode(next: Mode) {
    setMode(next)
    setError(null)
    setMessage(null)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    if (mode === 'forgot') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      setLoading(false)
      if (error) setError(error.message)
      else setMessage('Check your email for a reset link.')
      return
    }

    const { error } =
      mode === 'sign-in'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })

    setLoading(false)
    if (error) setError(error.message)
    else if (mode === 'sign-up') setMessage('Check your email to confirm your account.')
  }

  return (
    <div className="flex h-full flex-col justify-center p-6">
      <h1 className="text-2xl font-semibold text-ink">{titles[mode]}</h1>
      <p className="mt-1 text-sm text-muted">Your data stays private to your account.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-ink">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 min-h-[44px] w-full rounded-xl border border-border px-3 text-base"
          />
        </div>

        {mode !== 'forgot' && (
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-ink">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 min-h-[44px] w-full rounded-xl border border-border px-3 text-base"
            />
          </div>
        )}

        {error && (
          <p role="alert" className="text-sm text-primary">
            {error}
          </p>
        )}
        {message && (
          <p role="status" className="text-sm text-muted">
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="min-h-[44px] w-full rounded-xl bg-primary py-3 font-medium text-white shadow-sm disabled:opacity-60"
        >
          {loading
            ? 'Please wait…'
            : mode === 'sign-in'
              ? 'Sign in'
              : mode === 'sign-up'
                ? 'Sign up'
                : 'Send reset link'}
        </button>
      </form>

      <div className="mt-4 flex justify-between text-sm">
        {mode === 'sign-in' ? (
          <>
            <button onClick={() => switchMode('sign-up')} className="text-primary">
              Create account
            </button>
            <button onClick={() => switchMode('forgot')} className="text-muted">
              Forgot password?
            </button>
          </>
        ) : (
          <button onClick={() => switchMode('sign-in')} className="text-primary">
            Back to sign in
          </button>
        )}
      </div>
    </div>
  )
}
