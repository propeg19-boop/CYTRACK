import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './supabase';
import { UserProfile } from './types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  isOnboarded: boolean;
  isDemoMode: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_DEMO_KEY = 'cytrack_demo_user';
const LOCAL_STORAGE_DEMO_PROFILE = 'cytrack_demo_profile';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const fetchProfile = async (userId: string) => {
    if (!isSupabaseConfigured || isDemoMode) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error loading profile:', error);
      } else if (data) {
        setProfile(data as UserProfile);
      }
    } catch (err) {
      console.error('Profile fetch exception:', err);
    }
  };

  useEffect(() => {
    // Check if running in demo/offline mode
    const storedDemoUser = localStorage.getItem(LOCAL_STORAGE_DEMO_KEY);
    if (!isSupabaseConfigured && storedDemoUser) {
      const parsedUser = JSON.parse(storedDemoUser);
      setUser(parsedUser);
      const storedProfile = localStorage.getItem(LOCAL_STORAGE_DEMO_PROFILE);
      if (storedProfile) {
        setProfile(JSON.parse(storedProfile));
      }
      setIsDemoMode(true);
      setLoading(false);
      return;
    }

    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // Live Supabase Auth Listener
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [isDemoMode]);

  const signUp = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      // Offline / Demo Signup
      const fakeUser: User = {
        id: 'demo-user-' + Date.now(),
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        email,
      };
      localStorage.setItem(LOCAL_STORAGE_DEMO_KEY, JSON.stringify(fakeUser));
      const initialProfile: UserProfile = {
        id: fakeUser.id,
        email,
        onboarding_completed: false,
        typical_cycle_length: 28,
        typical_period_duration: 5,
        cycles_regular: true,
        reminder_enabled: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      localStorage.setItem(LOCAL_STORAGE_DEMO_PROFILE, JSON.stringify(initialProfile));
      setUser(fakeUser);
      setProfile(initialProfile);
      setIsDemoMode(true);
      return { error: null };
    }

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (!error && data.user) {
      // Profile trigger or initial insert
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email: data.user.email,
        onboarding_completed: false,
      });
    }
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      const storedDemo = localStorage.getItem(LOCAL_STORAGE_DEMO_KEY);
      if (storedDemo) {
        const u = JSON.parse(storedDemo);
        setUser(u);
        const p = localStorage.getItem(LOCAL_STORAGE_DEMO_PROFILE);
        if (p) setProfile(JSON.parse(p));
        setIsDemoMode(true);
        return { error: null };
      }
      return { error: new Error('Demo account not found. Please click Sign Up to create one.') };
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    if (isDemoMode || !isSupabaseConfigured) {
      localStorage.removeItem(LOCAL_STORAGE_DEMO_KEY);
      localStorage.removeItem(LOCAL_STORAGE_DEMO_PROFILE);
      setUser(null);
      setProfile(null);
      setIsDemoMode(false);
      return;
    }
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const resetPassword = async (email: string) => {
    if (!isSupabaseConfigured) {
      return { error: null };
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: new Error('No user logged in') };

    if (isDemoMode || !isSupabaseConfigured) {
      const updated = { ...(profile || {}), ...updates, updated_at: new Date().toISOString() } as UserProfile;
      setProfile(updated);
      localStorage.setItem(LOCAL_STORAGE_DEMO_PROFILE, JSON.stringify(updated));
      return { error: null };
    }

    const { error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (!error) {
      setProfile(prev => (prev ? { ...prev, ...updates } : null));
    }
    return { error };
  };

  const completeOnboarding = async (data: {
    primary_goal: string;
    preferred_tone: string;
    typical_cycle_length: number;
    typical_period_duration: number;
    cycles_regular: boolean;
    reminder_enabled: boolean;
    last_period_start: string | null;
    last_period_end?: string | null;
  }) => {
    if (!user) return { error: new Error('No user logged in') };

    if (isDemoMode || !isSupabaseConfigured) {
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
      setProfile(updatedProfile);
      localStorage.setItem(LOCAL_STORAGE_DEMO_PROFILE, JSON.stringify(updatedProfile));

      if (data.last_period_start) {
        const demoCycles = [
          {
            id: 'cycle-' + Date.now(),
            user_id: user.id,
            start_date: data.last_period_start,
            end_date: data.last_period_end || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ];
        localStorage.setItem('cytrack_demo_cycles', JSON.stringify(demoCycles));
      }
      return { error: null };
    }

    try {
      const { error } = await supabase.rpc('complete_user_onboarding', {
        p_primary_goal: data.primary_goal,
        p_preferred_tone: data.preferred_tone,
        p_typical_cycle_length: data.typical_cycle_length,
        p_typical_period_duration: data.typical_period_duration,
        p_cycles_regular: data.cycles_regular,
        p_reminder_enabled: data.reminder_enabled,
        p_last_period_start: data.last_period_start,
        p_last_period_end: data.last_period_end || null,
      });

      if (error) {
        // Fallback direct table updates if RPC hasn't been applied yet
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

        if (data.last_period_start) {
          await supabase.from('cycles').insert({
            user_id: user.id,
            start_date: data.last_period_start,
            end_date: data.last_period_end || null,
          });
        }
      }

      await fetchProfile(user.id);
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const enableDemoMode = () => {
    const demoUser: User = {
      id: 'demo-user-123',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      email: 'demo@cytrack.app',
    };
    localStorage.setItem(LOCAL_STORAGE_DEMO_KEY, JSON.stringify(demoUser));
    setUser(demoUser);
    setIsDemoMode(true);
    const existing = localStorage.getItem(LOCAL_STORAGE_DEMO_PROFILE);
    if (existing) {
      setProfile(JSON.parse(existing));
    }
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
        signUp,
        signIn,
        signOut,
        resetPassword,
        updateProfile,
        completeOnboarding,
        enableDemoMode,
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
