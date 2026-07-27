import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/navidromeAuth', () => ({
  authenticateByName: vi.fn(),
  validateToken: vi.fn(),
}));
vi.mock('../../lib/sessionStore', () => ({ setSession: vi.fn() }));
vi.mock('../../lib/sessionPersistence', () => ({
  loadStoredSession: vi.fn(),
  storeSession: vi.fn(),
  clearStoredSession: vi.fn(),
}));

import { authenticateByName, validateToken } from '../../lib/navidromeAuth';
import { setSession } from '../../lib/sessionStore';
import { clearStoredSession, loadStoredSession, storeSession } from '../../lib/sessionPersistence';
import { currentUsername, signIn, signOut } from './authClient';

const stored = {
  username: 'cadence-test',
  userId: 'u',
  subsonicSalt: 'salt1',
  subsonicToken: 'tok1',
};

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
    vi.mocked(loadStoredSession).mockResolvedValue(stored);
    vi.mocked(validateToken).mockResolvedValue(true);
    expect(await currentUsername()).toBe('cadence-test');
    expect(setSession).toHaveBeenCalledWith(stored);
  });

  it('currentUsername clears a dead session', async () => {
    vi.mocked(loadStoredSession).mockResolvedValue({ ...stored, username: 'x' });
    vi.mocked(validateToken).mockResolvedValue(false);
    expect(await currentUsername()).toBeNull();
    expect(clearStoredSession).toHaveBeenCalled();
    expect(setSession).toHaveBeenCalledWith(null);
  });

  it('signIn authenticates, primes the store, and persists', async () => {
    vi.mocked(authenticateByName).mockResolvedValue(stored);
    await signIn('cadence-test', 'pw');
    expect(setSession).toHaveBeenCalledWith(stored);
    expect(storeSession).toHaveBeenCalledWith(stored);
  });

  it('signOut clears memory + durable store', async () => {
    await signOut();
    expect(setSession).toHaveBeenCalledWith(null);
    expect(clearStoredSession).toHaveBeenCalled();
  });
});
