import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/jellyfinAuth', () => ({
  authenticateByName: vi.fn(),
  validateToken: vi.fn(),
}));
vi.mock('../../lib/sessionStore', () => ({ setSession: vi.fn() }));
vi.mock('../../lib/sessionPersistence', () => ({
  loadStoredSession: vi.fn(),
  storeSession: vi.fn(),
  clearStoredSession: vi.fn(),
}));
vi.mock('../settings/forceOfflineStore', () => ({ readForceOffline: vi.fn(() => false) }));
vi.mock('../../lib/sessionExpiry', () => ({ notifySessionExpired: vi.fn() }));

import { authenticateByName, validateToken } from '../../lib/jellyfinAuth';
import { setSession } from '../../lib/sessionStore';
import { clearStoredSession, loadStoredSession, storeSession } from '../../lib/sessionPersistence';
import { notifySessionExpired } from '../../lib/sessionExpiry';
import { readForceOffline } from '../settings/forceOfflineStore';
import { currentUsername, currentUsernameOptimistic, signIn, signOut } from './authClient';

/** Let the fire-and-forget background validate settle (it's a microtask chain). */
const flush = () => new Promise((r) => setTimeout(r, 0));

describe('authClient', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('currentUsername returns null when nothing is stored', async () => {
    vi.mocked(loadStoredSession).mockResolvedValue(null);
    expect(await currentUsername()).toBeNull();
    expect(setSession).not.toHaveBeenCalled();
  });

  it('currentUsername validates a stored session and primes the store', async () => {
    vi.mocked(loadStoredSession).mockResolvedValue({
      token: 't',
      userId: 'u',
      username: 'cadence-test',
    });
    vi.mocked(validateToken).mockResolvedValue({ Id: 'u', Name: 'cadence-test' });
    expect(await currentUsername()).toBe('cadence-test');
    // Non-admin (no Policy.IsAdministrator) → isAdmin false, and re-persisted so
    // a later offline launch trusts the right flag.
    expect(setSession).toHaveBeenCalledWith({ token: 't', userId: 'u', isAdmin: false });
    expect(storeSession).toHaveBeenCalledWith(
      expect.objectContaining({ token: 't', userId: 'u', isAdmin: false }),
    );
  });

  it('currentUsername records admin status from the validated user', async () => {
    vi.mocked(loadStoredSession).mockResolvedValue({ token: 't', userId: 'u', username: 'admin' });
    vi.mocked(validateToken).mockResolvedValue({
      Id: 'u',
      Name: 'admin',
      Policy: { IsAdministrator: true },
    });
    expect(await currentUsername()).toBe('admin');
    expect(setSession).toHaveBeenCalledWith({ token: 't', userId: 'u', isAdmin: true });
  });

  it('currentUsername trusts the stored session in offline mode (no validate call)', async () => {
    vi.mocked(loadStoredSession).mockResolvedValue({
      token: 't',
      userId: 'u',
      username: 'cadence-test',
    });
    vi.mocked(readForceOffline).mockReturnValue(true);
    expect(await currentUsername()).toBe('cadence-test');
    expect(validateToken).not.toHaveBeenCalled(); // would throw offline; must be skipped
    expect(setSession).toHaveBeenCalledWith({ token: 't', userId: 'u' });
  });

  it('currentUsername trusts the stored session when validation fails offline (airplane launch)', async () => {
    vi.mocked(loadStoredSession).mockResolvedValue({
      token: 't',
      userId: 'u',
      username: 'cadence-test',
    });
    vi.mocked(readForceOffline).mockReturnValue(false);
    vi.mocked(validateToken).mockRejectedValue(new Error('network')); // offline
    expect(await currentUsername()).toBe('cadence-test'); // resolves, doesn't hang/sign out
    expect(clearStoredSession).not.toHaveBeenCalled();
    expect(setSession).toHaveBeenCalledWith({ token: 't', userId: 'u' });
  });

  it('currentUsername clears a dead token', async () => {
    vi.mocked(loadStoredSession).mockResolvedValue({
      token: 'bad',
      userId: 'u',
      username: 'x',
    });
    vi.mocked(validateToken).mockResolvedValue(null);
    expect(await currentUsername()).toBeNull();
    expect(clearStoredSession).toHaveBeenCalled();
    expect(setSession).toHaveBeenCalledWith(null);
  });

  it('signIn authenticates, primes the store, and persists', async () => {
    vi.mocked(authenticateByName).mockResolvedValue({ token: 't', userId: 'u' });
    await signIn('cadence-test', 'pw');
    expect(setSession).toHaveBeenCalledWith({ token: 't', userId: 'u' });
    expect(storeSession).toHaveBeenCalledWith({
      token: 't',
      userId: 'u',
      username: 'cadence-test',
    });
  });

  it('signOut clears memory + durable store', async () => {
    await signOut();
    expect(setSession).toHaveBeenCalledWith(null);
    expect(clearStoredSession).toHaveBeenCalled();
  });

  describe('currentUsernameOptimistic', () => {
    it('returns null when nothing is stored (show sign-in)', async () => {
      vi.mocked(loadStoredSession).mockResolvedValue(null);
      expect(await currentUsernameOptimistic()).toBeNull();
      expect(setSession).not.toHaveBeenCalled();
    });

    it('primes the session and returns the username IMMEDIATELY, before validation', async () => {
      vi.mocked(loadStoredSession).mockResolvedValue({ token: 't', userId: 'u', username: 'me' });
      // A validate that never resolves — the return must NOT wait on it.
      vi.mocked(validateToken).mockReturnValue(new Promise(() => {}));
      expect(await currentUsernameOptimistic()).toBe('me');
      expect(setSession).toHaveBeenCalledWith({ token: 't', userId: 'u' });
    });

    it('signs out in the background on a confirmed 401 (validate → null)', async () => {
      vi.mocked(loadStoredSession).mockResolvedValue({ token: 'bad', userId: 'u', username: 'me' });
      vi.mocked(validateToken).mockResolvedValue(null);
      expect(await currentUsernameOptimistic()).toBe('me'); // still optimistic up front
      await flush();
      expect(clearStoredSession).toHaveBeenCalled();
      expect(setSession).toHaveBeenLastCalledWith(null);
      expect(notifySessionExpired).toHaveBeenCalled(); // bounces to sign-in
    });

    it('keeps trusting the session when the background validate errors (offline)', async () => {
      vi.mocked(loadStoredSession).mockResolvedValue({ token: 't', userId: 'u', username: 'me' });
      vi.mocked(validateToken).mockRejectedValue(new Error('offline'));
      expect(await currentUsernameOptimistic()).toBe('me');
      await flush();
      expect(clearStoredSession).not.toHaveBeenCalled();
      expect(notifySessionExpired).not.toHaveBeenCalled();
    });

    it('skips the background validate entirely in forced-offline mode', async () => {
      vi.mocked(loadStoredSession).mockResolvedValue({ token: 't', userId: 'u', username: 'me' });
      vi.mocked(readForceOffline).mockReturnValue(true);
      expect(await currentUsernameOptimistic()).toBe('me');
      await flush();
      expect(validateToken).not.toHaveBeenCalled();
    });
  });
});
