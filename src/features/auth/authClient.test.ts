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

import { authenticateByName, validateToken } from '../../lib/jellyfinAuth';
import { setSession } from '../../lib/sessionStore';
import { clearStoredSession, loadStoredSession, storeSession } from '../../lib/sessionPersistence';
import { currentUsername, signIn, signOut } from './authClient';

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
});
