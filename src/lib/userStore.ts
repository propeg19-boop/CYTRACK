/**
 * CYTRACK — Persistent User Vault & Account Management Store
 * 
 * Solves:
 * 1. "Users cant sign in" — Full local credential verification, password hashing, and session management.
 * 2. "System isn't remembering their sign up" — Permanent user registry in persistent storage that survives sign-outs, page reloads, and tab closures.
 * 3. "Only one sign up for them" — Automatic duplicate detection, prefilled sign-in redirection, and returning-user instant recognition.
 * 4. User data scoping — Isolates cycle logs, notes, and profile per user ID so data never collides or gets deleted on logout.
 */

import { User } from '@supabase/supabase-js';
import { UserProfile } from './types';

export interface StoredAccount {
  id: string;
  email: string;
  passwordHash: string;
  salt: string;
  profile: UserProfile;
  createdAt: string;
  lastLoginAt: string;
  rememberMe: boolean;
}

export interface ActiveSession {
  userId: string;
  email: string;
  rememberMe: boolean;
  signedInAt: string;
}

export interface RememberedAccount {
  email: string;
  name?: string;
  savedAt: string;
}

const STORAGE_ACCOUNTS_KEY = 'cytrack_registered_accounts';
const STORAGE_ACTIVE_SESSION_KEY = 'cytrack_active_session';
const STORAGE_REMEMBERED_KEY = 'cytrack_last_remembered_user';
const LEGACY_DEMO_USER_KEY = 'cytrack_demo_user';
const LEGACY_DEMO_PROFILE_KEY = 'cytrack_demo_profile';

// Fast, secure Web Crypto SHA-256 hash with salt
export async function hashPassword(password: string, salt: string): Promise<string> {
  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(password + salt + '_cytrack_secure_salt_2026');
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (err) {
    console.warn('Crypto subtle unavailable, using fallback hash:', err);
  }
  // Deterministic fallback hash
  let hash = 0;
  const str = password + salt + '_cytrack_fallback';
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36) + '_secure';
}

function generateSalt(): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const arr = new Uint8Array(16);
    window.crypto.getRandomValues(arr);
    return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
  }
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// ─── LOCAL ACCOUNTS VAULT ─────────────────────────────────────

export function getRegisteredAccounts(): Record<string, StoredAccount> {
  try {
    const raw = localStorage.getItem(STORAGE_ACCOUNTS_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse registered accounts:', e);
    return {};
  }
}

export function saveRegisteredAccounts(accounts: Record<string, StoredAccount>): void {
  try {
    localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch (e) {
    console.error('Failed to save registered accounts:', e);
  }
}

export function findAccountByEmail(email: string): StoredAccount | null {
  if (!email) return null;
  const accounts = getRegisteredAccounts();
  const normalized = email.trim().toLowerCase();
  return accounts[normalized] || null;
}

export function checkEmailExists(email: string): boolean {
  return findAccountByEmail(email) !== null;
}

export async function registerLocalAccount(
  email: string,
  password: string,
  initialProfileOverrides?: Partial<UserProfile>,
  rememberMe: boolean = true
): Promise<{ user: User; profile: UserProfile; error: Error | null }> {
  const normalizedEmail = email.trim().toLowerCase();
  const accounts = getRegisteredAccounts();

  if (accounts[normalizedEmail]) {
    return {
      user: null as any,
      profile: null as any,
      error: new Error('ACCOUNT_ALREADY_EXISTS'),
    };
  }

  const userId = 'usr_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
  const salt = generateSalt();
  const passwordHash = await hashPassword(password, salt);
  const now = new Date().toISOString();

  const profile: UserProfile = {
    id: userId,
    email: normalizedEmail,
    onboarding_completed: false,
    typical_cycle_length: 28,
    typical_period_duration: 5,
    cycles_regular: true,
    reminder_enabled: false,
    created_at: now,
    updated_at: now,
    ...initialProfileOverrides,
  };

  const storedAccount: StoredAccount = {
    id: userId,
    email: normalizedEmail,
    passwordHash,
    salt,
    profile,
    createdAt: now,
    lastLoginAt: now,
    rememberMe,
  };

  accounts[normalizedEmail] = storedAccount;
  saveRegisteredAccounts(accounts);

  const fakeUser: User = {
    id: userId,
    app_metadata: { provider: 'local' },
    user_metadata: { email: normalizedEmail },
    aud: 'authenticated',
    created_at: now,
    email: normalizedEmail,
  };

  // Save active session & sync legacy keys
  saveActiveSession(userId, normalizedEmail, rememberMe);
  rememberAccount(normalizedEmail);
  syncLegacyDemoKeys(fakeUser, profile);

  return { user: fakeUser, profile, error: null };
}

export async function authenticateLocalAccount(
  email: string,
  password: string,
  rememberMe: boolean = true
): Promise<{ user: User; profile: UserProfile; error: Error | null }> {
  const normalizedEmail = email.trim().toLowerCase();
  const accounts = getRegisteredAccounts();
  const account = accounts[normalizedEmail];

  if (!account) {
    return {
      user: null as any,
      profile: null as any,
      error: new Error('ACCOUNT_NOT_FOUND'),
    };
  }

  const computedHash = await hashPassword(password, account.salt);
  if (computedHash !== account.passwordHash) {
    return {
      user: null as any,
      profile: null as any,
      error: new Error('INVALID_PASSWORD'),
    };
  }

  // Update last login
  account.lastLoginAt = new Date().toISOString();
  account.rememberMe = rememberMe;
  accounts[normalizedEmail] = account;
  saveRegisteredAccounts(accounts);

  const fakeUser: User = {
    id: account.id,
    app_metadata: { provider: 'local' },
    user_metadata: { email: normalizedEmail },
    aud: 'authenticated',
    created_at: account.createdAt,
    email: normalizedEmail,
  };

  saveActiveSession(account.id, normalizedEmail, rememberMe);
  rememberAccount(normalizedEmail);
  syncLegacyDemoKeys(fakeUser, account.profile);

  return { user: fakeUser, profile: account.profile, error: null };
}

export async function resetLocalPassword(email: string, newPassword?: string): Promise<{ success: boolean; error: Error | null }> {
  const normalizedEmail = email.trim().toLowerCase();
  const accounts = getRegisteredAccounts();
  const account = accounts[normalizedEmail];

  if (!account) {
    return { success: false, error: new Error('No account found with this email.') };
  }

  if (newPassword) {
    const salt = generateSalt();
    const hash = await hashPassword(newPassword, salt);
    account.salt = salt;
    account.passwordHash = hash;
    accounts[normalizedEmail] = account;
    saveRegisteredAccounts(accounts);
  }

  return { success: true, error: null };
}

export function updateAccountProfileInStore(userId: string, updates: Partial<UserProfile>): UserProfile | null {
  const accounts = getRegisteredAccounts();
  for (const emailKey in accounts) {
    if (accounts[emailKey].id === userId) {
      const updated = {
        ...accounts[emailKey].profile,
        ...updates,
        updated_at: new Date().toISOString(),
      };
      accounts[emailKey].profile = updated;
      saveRegisteredAccounts(accounts);
      localStorage.setItem(LEGACY_DEMO_PROFILE_KEY, JSON.stringify(updated));
      return updated;
    }
  }
  return null;
}

export function deleteAccountFromStore(userId: string): void {
  const accounts = getRegisteredAccounts();
  for (const emailKey in accounts) {
    if (accounts[emailKey].id === userId) {
      delete accounts[emailKey];
      break;
    }
  }
  saveRegisteredAccounts(accounts);
  clearActiveSession();
  try {
    localStorage.removeItem(`cytrack_cycles_${userId}`);
    localStorage.removeItem(`cytrack_logs_${userId}`);
  } catch (e) {
    // silent
  }
}

// ─── ACTIVE SESSION & REMEMBER ME ──────────────────────────────

export function saveActiveSession(userId: string, email: string, rememberMe: boolean = true): void {
  try {
    const session: ActiveSession = {
      userId,
      email: email.trim().toLowerCase(),
      rememberMe,
      signedInAt: new Date().toISOString(),
    };
    if (rememberMe) {
      localStorage.setItem(STORAGE_ACTIVE_SESSION_KEY, JSON.stringify(session));
    } else {
      sessionStorage.setItem(STORAGE_ACTIVE_SESSION_KEY, JSON.stringify(session));
      localStorage.removeItem(STORAGE_ACTIVE_SESSION_KEY);
    }
  } catch (e) {
    console.error('Failed to save active session:', e);
  }
}

export function getActiveSession(): ActiveSession | null {
  try {
    const local = localStorage.getItem(STORAGE_ACTIVE_SESSION_KEY);
    if (local) return JSON.parse(local);
    const session = sessionStorage.getItem(STORAGE_ACTIVE_SESSION_KEY);
    if (session) return JSON.parse(session);
  } catch (e) {
    console.error('Failed to read active session:', e);
  }
  return null;
}

export function clearActiveSession(): void {
  try {
    localStorage.removeItem(STORAGE_ACTIVE_SESSION_KEY);
    sessionStorage.removeItem(STORAGE_ACTIVE_SESSION_KEY);
    localStorage.removeItem(LEGACY_DEMO_USER_KEY);
    localStorage.removeItem(LEGACY_DEMO_PROFILE_KEY);
  } catch (e) {
    console.error('Failed to clear active session:', e);
  }
}

export function rememberAccount(email: string, name?: string): void {
  try {
    const item: RememberedAccount = {
      email: email.trim().toLowerCase(),
      name,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_REMEMBERED_KEY, JSON.stringify(item));
  } catch (e) {
    console.error('Failed to remember account:', e);
  }
}

export function getRememberedAccount(): RememberedAccount | null {
  try {
    const raw = localStorage.getItem(STORAGE_REMEMBERED_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function forgetRememberedAccount(): void {
  try {
    localStorage.removeItem(STORAGE_REMEMBERED_KEY);
  } catch (e) {
    // silent
  }
}

function syncLegacyDemoKeys(user: User, profile: UserProfile): void {
  try {
    localStorage.setItem(LEGACY_DEMO_USER_KEY, JSON.stringify(user));
    localStorage.setItem(LEGACY_DEMO_PROFILE_KEY, JSON.stringify(profile));
  } catch (e) {
    // silent
  }
}

// ─── AUTOMATIC DATA MIGRATION ON INIT ─────────────────────────
export function initializeUserStoreMigration(): void {
  try {
    const accounts = getRegisteredAccounts();
    const legacyUserRaw = localStorage.getItem(LEGACY_DEMO_USER_KEY);
    const legacyProfileRaw = localStorage.getItem(LEGACY_DEMO_PROFILE_KEY);

    if (legacyUserRaw && Object.keys(accounts).length === 0) {
      const legacyUser = JSON.parse(legacyUserRaw);
      const legacyProfile = legacyProfileRaw ? JSON.parse(legacyProfileRaw) : null;
      const email = (legacyUser.email || 'demo@cytrack.app').trim().toLowerCase();

      // Create initial local account so existing user isn't wiped
      const salt = generateSalt();
      hashPassword('password', salt).then(hash => {
        const now = new Date().toISOString();
        const account: StoredAccount = {
          id: legacyUser.id || 'demo-user-123',
          email,
          passwordHash: hash,
          salt,
          profile: legacyProfile || {
            id: legacyUser.id,
            email,
            onboarding_completed: true,
            typical_cycle_length: 28,
            typical_period_duration: 5,
            cycles_regular: true,
            reminder_enabled: false,
            created_at: now,
            updated_at: now,
          },
          createdAt: now,
          lastLoginAt: now,
          rememberMe: true,
        };
        accounts[email] = account;
        saveRegisteredAccounts(accounts);
        saveActiveSession(account.id, email, true);
        rememberAccount(email);
      });
    }
  } catch (err) {
    console.error('Migration error:', err);
  }
}
