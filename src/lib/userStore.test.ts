import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import {
  registerLocalAccount,
  authenticateLocalAccount,
  findAccountByEmail,
  checkEmailExists,
  getActiveSession,
  clearActiveSession,
  getRememberedAccount,
  deleteAccountFromStore,
  hashPassword,
} from './userStore';

// In-memory Storage polyfill for Node.js test runner environment
class MemoryStorage {
  private store: Record<string, string> = {};
  getItem(key: string): string | null {
    return Object.prototype.hasOwnProperty.call(this.store, key) ? this.store[key] : null;
  }
  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }
  removeItem(key: string): void {
    delete this.store[key];
  }
  clear(): void {
    this.store = {};
  }
}

beforeAll(() => {
  if (typeof globalThis.localStorage === 'undefined') {
    (globalThis as any).localStorage = new MemoryStorage();
  }
  if (typeof globalThis.sessionStorage === 'undefined') {
    (globalThis as any).sessionStorage = new MemoryStorage();
  }
});

describe('userStore Authentication & Persistence Vault', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('hashes passwords securely and consistently with salt', async () => {
    const salt = 'random_salt_123';
    const hash1 = await hashPassword('mysecretpassword', salt);
    const hash2 = await hashPassword('mysecretpassword', salt);
    const diffHash = await hashPassword('differentpassword', salt);

    expect(hash1).toBeTruthy();
    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(diffHash);
  });

  it('registers a new account and preserves credentials across sessions', async () => {
    const res = await registerLocalAccount('testuser@example.com', 'password123');
    expect(res.error).toBeNull();
    expect(res.user).toBeTruthy();
    expect(res.user.email).toBe('testuser@example.com');
    expect(res.profile.onboarding_completed).toBe(false);

    // Verify account exists in persistent storage
    const found = findAccountByEmail('testuser@example.com');
    expect(found).not.toBeNull();
    expect(found?.email).toBe('testuser@example.com');

    // Case insensitivity
    expect(checkEmailExists('TESTUSER@EXAMPLE.COM')).toBe(true);

    // Active session should be saved
    const active = getActiveSession();
    expect(active?.email).toBe('testuser@example.com');

    // Remembered account should be set
    const remembered = getRememberedAccount();
    expect(remembered?.email).toBe('testuser@example.com');
  });

  it('enforces "only one sign up" — rejects duplicate registrations', async () => {
    const first = await registerLocalAccount('unique@example.com', 'secret123');
    expect(first.error).toBeNull();

    // Second registration with the same email
    const second = await registerLocalAccount('unique@example.com', 'anothersecret');
    expect(second.error).not.toBeNull();
    expect(second.error?.message).toBe('ACCOUNT_ALREADY_EXISTS');
  });

  it('authenticates with correct password and rejects invalid password', async () => {
    await registerLocalAccount('auth@example.com', 'correctpass');

    // Sign out active session
    clearActiveSession();
    expect(getActiveSession()).toBeNull();

    // Try with wrong password
    const fail = await authenticateLocalAccount('auth@example.com', 'wrongpass');
    expect(fail.error?.message).toBe('INVALID_PASSWORD');
    expect(getActiveSession()).toBeNull();

    // Try with correct password
    const success = await authenticateLocalAccount('auth@example.com', 'correctpass');
    expect(success.error).toBeNull();
    expect(success.user.email).toBe('auth@example.com');
    expect(getActiveSession()?.email).toBe('auth@example.com');
  });

  it('signing out clears the active session but NEVER destroys the user account or registration', async () => {
    await registerLocalAccount('persistent@example.com', 'password123');

    // Active session is present
    expect(getActiveSession()).not.toBeNull();

    // User signs out
    clearActiveSession();

    // Active session is cleared
    expect(getActiveSession()).toBeNull();

    // But user account STILL EXISTS and is remembered!
    expect(checkEmailExists('persistent@example.com')).toBe(true);
    expect(getRememberedAccount()?.email).toBe('persistent@example.com');

    // User can sign back in immediately with their password!
    const reLogin = await authenticateLocalAccount('persistent@example.com', 'password123');
    expect(reLogin.error).toBeNull();
    expect(reLogin.user.email).toBe('persistent@example.com');
  });

  it('deletes account cleanly when requested', async () => {
    const created = await registerLocalAccount('delete_me@example.com', 'password123');
    expect(checkEmailExists('delete_me@example.com')).toBe(true);

    deleteAccountFromStore(created.user.id);
    expect(checkEmailExists('delete_me@example.com')).toBe(false);
    expect(getActiveSession()).toBeNull();
  });
});
