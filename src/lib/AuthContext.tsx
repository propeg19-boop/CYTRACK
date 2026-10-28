import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './supabase';
import { UserProfile } from './types';
import {
  initializeUserStoreMigration,
  getActiveSession,
  saveActiveSession,
  clearActiveSession,
  findAccountByEmail,
  checkEmailExists,
  registerLocalAccount,
  authenticateLocalAccount,
  resetLocalPassword,
  updateAccountProfileInStore,
  deleteAccountFromStore,
  getRememberedAccount,
  rememberAccount,
  forgetRememberedAccount,
  RememberedAccount,
} from './userStore';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  isOnboarded: boolean;
  isDemoMode: boolean;
  rememberedAccount: RememberedAccount | null;
  signUp: (email: string, password: string, rememberMe?: boolean) => Promise<{ error: Error | null; isExisting?: boolean }>;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string, newPassword?: string) => Promise<{ error: Error | null }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: Error | null }>;
  completeOnboarding: (data: {
    primary_goal: string;
    preferred_tone: string;
    typical_cycle_length: number;
    typical_period_duration: number;
    cycles_regular: boolean;
    reminder_enabled: boolean;
    last_period_start: string | null;
    last_period_end?: string | null;
  }) => Promise<{ error: Error | null }>;
  enableDemoMode: () => void;
  checkEmail: (email: string) => boolean;
  clearRemembered: () => void;
  deleteAccount: () => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [rememberedAccount, setRememberedAccount] = useState<RememberedAccount | null>(null);

  // Initialize data migration on first mount
  useEffect(() => {
    initializeUserStoreMigration();
    setRememberedAccount(getRememberedAccount());
  }, []);

  const fetchProfile = useCallback(async (userId: string, userEmail?: string) => {
    // Check local store first
    if (userEmail) {
      const localAcc = findAccountByEmail(userEmail);
      if (localAcc?.profile) {
        setProfile(localAcc.profile);
      }
    }

    if (!isSupabaseConfigured) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.warn('Error loading Supabase profile:', error.message);
      } else if (data) {
        setProfile(data as UserProfile);
        updateAccountProfileInStore(userId, data as UserProfile);
      }
    } catch (err) {
      console.warn('Profile fetch exception:', err);
    }
  }, []);

  // Main session restoration logic
  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      try {
        // 1. Check local active session first
        const activeSession = getActiveSession();

        if (activeSession) {
          const account = findAccountByEmail(activeSession.email);
          if (account && isMounted) {
            const localUser: User = {
              id: account.id,
              app_metadata: { provider: 'local' },
              user_metadata: { email: account.email },
              aud: 'authenticated',
              created_at: account.createdAt,
              email: account.email,
            };
            setUser(localUser);
            setProfile(account.profile);
            setIsDemoMode(!isSupabaseConfigured);
          }
        }

        // 2. If Supabase is configured, check live session
        if (isSupabaseConfigured) {
          const { data: { session: supaSession } } = await supabase.auth.getSession();
          if (isMounted) {
            if (supaSession?.user) {
              setSession(supaSession);
              setUser(supaSession.user);
              setIsDemoMode(false);
              await fetchProfile(supaSession.user.id, supaSession.user.email);
            }
          }
        }
      } catch (err) {
        console.error('Session restoration error:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    restoreSession();

    // Setup Supabase live auth listener if configured
    let unsubscribe = () => {};
    if (isSupabaseConfigured) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
        if (!isMounted) return;
        setSession(newSession);
        if (newSession?.user) {
          setUser(newSession.user);
          setIsDemoMode(false);
          await fetchProfile(newSession.user.id, newSession.user.email);
          if (newSession.user.email) {
            saveActiveSession(newSession.user.id, newSession.user.email, true);
            rememberAccount(newSession.user.email);
            setRememberedAccount(getRememberedAccount());
          }
        } else if (!getActiveSession()) {
          setUser(null);
          setProfile(null);
        }
      });
      unsubscribe = () => subscription.unsubscribe();
    }

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [fetchProfile]);

  // Sign Up: Guarantees "Only one sign up for them"
  const signUp = async (
    email: string,
    password: string,
    rememberMe: boolean = true
  ): Promise<{ error: Error | null; isExisting?: boolean }> => {
    const normalizedEmail = email.trim().toLowerCase();

    // Check if account already exists locally
    if (checkEmailExists(normalizedEmail)) {
      rememberAccount(normalizedEmail);
      setRememberedAccount(getRememberedAccount());
      return {
        error: new Error('An account already exists for this email. You only need to sign up once! Please sign in with your password.'),
        isExisting: true,
      };
    }

    // Try Supabase first if configured
    if (isSupabaseConfigured) {
      try {
        const { data, error: supaErr } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
        });

        if (supaErr) {
          // If already registered in Supabase
          if (supaErr.message.toLowerCase().includes('already registered') || supaErr.status === 422) {
            rememberAccount(normalizedEmail);
            setRememberedAccount(getRememberedAccount());
            return {
              error: new Error('This email is already registered in CYTRACK. Please sign in below.'),
              isExisting: true,
            };
          }
          console.warn('Supabase sign up warning, falling back to local vault:', supaErr.message);
        } else if (data.user) {
          // Live user created in Supabase
          try {
            await supabase.from('profiles').upsert({
              id: data.user.id,
              email: data.user.email,
              onboarding_completed: false,
            });
          } catch (e) {
            // non-blocking
          }

          // Also save in local vault so offline or unconfirmed email never blocks the user
          await registerLocalAccount(normalizedEmail, password, undefined, rememberMe);

          if (data.session) {
            setSession(data.session);
            setUser(data.user);
            setIsDemoMode(false);
            await fetchProfile(data.user.id, normalizedEmail);
            rememberAccount(normalizedEmail);
            setRememberedAccount(getRememberedAccount());
            return { error: null };
          }
        }
      } catch (err: any) {
        console.warn('Supabase signup network error, continuing with local store:', err);
      }
    }

    // Register into persistent local vault
    const res = await registerLocalAccount(normalizedEmail, password, undefined, rememberMe);
    if (res.error) {
      return { error: res.error, isExisting: res.error.message === 'ACCOUNT_ALREADY_EXISTS' };
    }

    setUser(res.user);
    setProfile(res.profile);
    setIsDemoMode(true);
    rememberAccount(normalizedEmail);
    setRememberedAccount(getRememberedAccount());
    return { error: null };
  };

  // Sign In: Validates credentials and restores persistent account & data
  const signIn = async (
    email: string,
    password: string,
    rememberMe: boolean = true
  ): Promise<{ error: Error | null }> => {
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Try Supabase if configured
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

        if (!error && data.user) {
          setSession(data.session);
          setUser(data.user);
          setIsDemoMode(false);
          await fetchProfile(data.user.id, normalizedEmail);
          saveActiveSession(data.user.id, normalizedEmail, rememberMe);
          rememberAccount(normalizedEmail);
          setRememberedAccount(getRememberedAccount());
          return { error: null };
        }

        // If Supabase failed because email unconfirmed or network error, check local vault fallback
        console.warn('Supabase signIn response:', error?.message);
      } catch (err: any) {
        console.warn('Supabase signIn error, checking local store:', err);
      }
    }

    // 2. Check Local Accounts Vault
    const localRes = await authenticateLocalAccount(normalizedEmail, password, rememberMe);
    if (!localRes.error) {
      setUser(localRes.user);
      setProfile(localRes.profile);
      setIsDemoMode(true);
      rememberAccount(normalizedEmail);
      setRememberedAccount(getRememberedAccount());
      return { error: null };
    }

    if (localRes.error.message === 'INVALID_PASSWORD') {
      return { error: new Error('Incorrect password. Please verify your password and try again.') };
    }

    if (localRes.error.message === 'ACCOUNT_NOT_FOUND') {
      return { error: new Error('No account found for this email. Click "Create Account" to get started with your one-time sign-up.') };
    }

    return { error: localRes.error };
  };

  // Sign Out: Clears active session ONLY. Never deletes registered account or cycle history!
  const signOut = async () => {
    clearActiveSession();
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        // silent
      }
    }
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsDemoMode(false);
    // Refresh remembered account
    setRememberedAccount(getRememberedAccount());
  };

  // Reset Password
  const resetPassword = async (email: string, newPassword?: string): Promise<{ error: Error | null }> => {
    const normalizedEmail = email.trim().toLowerCase();

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (!error) return { error: null };
      } catch (e) {
        // continue to local
      }
    }

    const res = await resetLocalPassword(normalizedEmail, newPassword);
    return { error: res.error };
  };

  // Update Profile
  const updateProfile = async (updates: Partial<UserProfile>): Promise<{ error: Error | null }> => {
    if (!user) return { error: new Error('No active user session') };

    // Update in local store
    const updatedProfile = updateAccountProfileInStore(user.id, updates);
    if (updatedProfile) {
      setProfile(updatedProfile);
    } else {
      setProfile(prev => (prev ? { ...prev, ...updates } : null));
    }

    if (isSupabaseConfigured && !isDemoMode) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', user.id);
        if (error) console.warn('Supabase profile update warning:', error);
      } catch (err: any) {
        console.warn('Supabase profile update error:', err);
      }
    }

    return { error: null };
  };

  // Complete Onboarding
  const completeOnboarding = async (data: {
    primary_goal: string;
    preferred_tone: string;
    typical_cycle_length: number;
    typical_period_duration: number;
    cycles_regular: boolean;
    reminder_enabled: boolean;
    last_period_start: string | null;
    last_period_end?: string | null;
  }): Promise<{ error: Error | null }> => {
    if (!user) return { error: new Error('No user logged in') };

    const updatedProfile: UserProfile = {
      id: user.id,
      email: user.email ?? null,
      onboarding_completed: true,
      primary_goal: data.primary_goal,
      preferred_tone: data.preferred_tone,
      typical_cycle_length: data.typical_cycle_length,
      typical_period_duration: data.typical_period_duration,
      cycles_regular: data.cycles_regular,
      reminder_enabled: data.reminder_enabled,
      created_at: profile?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    updateAccountProfileInStore(user.id, updatedProfile);
    setProfile(updatedProfile);

    // Save initial cycle for user
    if (data.last_period_start) {
      const initialCycle = {
        id: 'cycle_' + Date.now(),
        user_id: user.id,
        start_date: data.last_period_start,
        end_date: data.last_period_end || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      try {
        const userCyclesKey = `cytrack_cycles_${user.id}`;
        localStorage.setItem(userCyclesKey, JSON.stringify([initialCycle]));
        localStorage.setItem('cytrack_demo_cycles', JSON.stringify([initialCycle]));
      } catch (e) {
        // silent
      }

      if (isSupabaseConfigured && !isDemoMode) {
        try {
          await supabase.from('cycles').insert({
            user_id: user.id,
            start_date: data.last_period_start,
            end_date: data.last_period_end || null,
          });
        } catch (e) {
          console.warn('Supabase cycle insert warning:', e);
        }
      }
    }

    if (isSupabaseConfigured && !isDemoMode) {
      try {
        await supabase.from('profiles').upsert({
          id: user.id,
          email: user.email,
          onboarding_completed: true,
          primary_goal: data.primary_goal,
          preferred_tone: data.preferred_tone,
          typical_cycle_length: data.typical_cycle_length,
          typical_period_duration: data.typical_period_duration,
          cycles_regular: data.cycles_regular,
          reminder_enabled: data.reminder_enabled,
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Supabase onboarding completion warning:', err);
      }
    }

    return { error: null };
  };

  // Instant Offline Demo Mode
  const enableDemoMode = () => {
    const demoEmail = 'guest@cytrack.app';
    registerLocalAccount(demoEmail, 'guest123', {
      onboarding_completed: true,
      typical_cycle_length: 28,
      typical_period_duration: 5,
    }, true).then(res => {
      if (res.user) {
        setUser(res.user);
        setProfile(res.profile);
        setIsDemoMode(true);
      } else {
        authenticateLocalAccount(demoEmail, 'guest123', true).then(authRes => {
          if (authRes.user) {
            setUser(authRes.user);
            setProfile(authRes.profile);
            setIsDemoMode(true);
          }
        });
      }
    });
  };

  // Delete Account
  const deleteAccount = async (): Promise<{ error: Error | null }> => {
    if (!user) return { error: new Error('No user logged in') };
    deleteAccountFromStore(user.id);
    await signOut();
    return { error: null };
  };

  const clearRemembered = () => {
    forgetRememberedAccount();
    setRememberedAccount(null);
  };

  const checkEmail = (email: string): boolean => {
    return checkEmailExists(email);
  };

  const isOnboarded = useMemo(() => {
    return Boolean(profile?.onboarding_completed);
  }, [profile]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        isOnboarded,
        isDemoMode,
        rememberedAccount,
        signUp,
        signIn,
        signOut,
        resetPassword,
        updateProfile,
        completeOnboarding,
        enableDemoMode,
        checkEmail,
        clearRemembered,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
