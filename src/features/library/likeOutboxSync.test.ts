import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/jellyfinItems', () => ({ addFavorite: vi.fn(), removeFavorite: vi.fn() }));
import { addFavorite, removeFavorite } from '../../lib/jellyfinItems';
import { setSession } from '../../lib/sessionStore';
import { __resetReachability, markReachable, markUnreachable } from '../../lib/reachabilityStore';
import { writeForceOffline } from '../settings/forceOfflineStore';
import { likeOutboxStore, pendingLike, queueLike } from './likeOutbox';
import { startLikeOutboxSync } from './likeOutboxSync';

const settle = () => new Promise((r) => setTimeout(r, 0));

describe('startLikeOutboxSync', () => {
  let stop: () => void = () => undefined;
  const qc = { invalidateQueries: vi.fn(() => Promise.resolve()) };
  beforeEach(() => {
    vi.mocked(addFavorite).mockResolvedValue();
    vi.mocked(removeFavorite).mockResolvedValue();
  });
  afterEach(() => {
    stop();
    vi.resetAllMocks();
    likeOutboxStore.set({});
    writeForceOffline(false);
    __resetReachability();
    setSession(null);
  });

  it('sends pending likes at start (a restart with wishes on disk) and refreshes the lists', async () => {
    setSession({ token: 't', userId: 'u1' });
    queueLike('a', true);
    queueLike('b', false);
    stop = startLikeOutboxSync(qc);
    await settle();
    expect(addFavorite).toHaveBeenCalledWith('a');
    expect(removeFavorite).toHaveBeenCalledWith('b');
    expect(pendingLike('a')).toBeUndefined();
    expect(qc.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['liked-songs'] });
  });

  it('waits while offline, then sends when the server answers again', async () => {
    setSession({ token: 't', userId: 'u1' });
    markUnreachable();
    queueLike('a', true);
    stop = startLikeOutboxSync(qc);
    await settle();
    expect(addFavorite).not.toHaveBeenCalled();
    markReachable();
    await settle();
    expect(addFavorite).toHaveBeenCalledWith('a');
  });

  it('waits for a session, and for offline mode to be switched off', async () => {
    writeForceOffline(true);
    stop = startLikeOutboxSync(qc);
    setSession({ token: 't', userId: 'u1' });
    queueLike('a', true);
    await settle();
    expect(addFavorite).not.toHaveBeenCalled();
    writeForceOffline(false);
    await settle();
    expect(addFavorite).toHaveBeenCalledWith('a');
  });

  it('retries on the browser "online" event and does nothing with no wishes', async () => {
    setSession({ token: 't', userId: 'u1' });
    stop = startLikeOutboxSync(qc);
    await settle();
    expect(addFavorite).not.toHaveBeenCalled();
    queueLike('a', true);
    window.dispatchEvent(new Event('online'));
    await settle();
    expect(addFavorite).toHaveBeenCalledWith('a');
  });

  it('does not refresh the lists when nothing reached the server', async () => {
    setSession({ token: 't', userId: 'u1' });
    vi.mocked(addFavorite).mockRejectedValue(new TypeError('Failed to fetch'));
    queueLike('a', true);
    stop = startLikeOutboxSync(qc);
    await settle();
    expect(qc.invalidateQueries).not.toHaveBeenCalled();
    expect(pendingLike('a')).toBe(true);
  });
});
