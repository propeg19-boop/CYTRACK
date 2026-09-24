import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

type AuthState = {
  session: Session | null
  loading: boolean
  isPasswordRecovery: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    // PASSWORD_RECOVERY fires when the user lands here via the reset-password
    // email link — Supabase gives them a real session at that point, so we
    // need this flag to route them to ResetPassword instead of the main app.
    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (event === 'PASSWORD_RECOVERY') setIsPasswordRecovery(true)
      setSession(newSession)
      setLoading(false)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    setIsPasswordRecovery(false)
  }

  return (
    <AuthContext.Provider value={{ session, loading, isPasswordRecovery, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
