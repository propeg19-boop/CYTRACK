/**
 * Supabase Client Initialization & Environment Validation
 * 
 * CRITICAL ARCHITECTURE RULE:
 * 1. Never crash with an unhandled exception or white screen if env vars are missing.
 * 2. Surface isSupabaseConfigured and configuration details clearly to the ErrorBoundary and App.
 * 3. Support local mock fallback state when testing without live Supabase credentials.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
export const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('http') &&
  supabaseAnonKey.length > 20
);

let clientInstance: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  try {
    clientInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
  }
}

export const supabase = clientInstance as SupabaseClient;

export function getMissingEnvDetails(): string[] {
  const missing: string[] = [];
  if (!supabaseUrl) missing.push('VITE_SUPABASE_URL');
  if (!supabaseAnonKey) missing.push('VITE_SUPABASE_ANON_KEY');
  return missing;
}
