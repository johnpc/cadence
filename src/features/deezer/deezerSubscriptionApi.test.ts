import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getDeezerSubscription } from './deezerSubscriptionApi';
import { setSession } from '../../lib/sessionStore';

beforeEach(() => {
  vi.stubEnv('VITE_JELLYFIN_URL', 'https://jf.example.com');
  setSession({ token: 'tok', userId: 'user-1' });
});

afterEach(() => {
  setSession(null);
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe('getDeezerSubscription', () => {
  it('returns the status with userId + playlistId in the query', async () => {
    const body = { DeezerPlaylistId: '908622995', MissingArtists: ['The Beatles'] };
    const f = vi.fn().mockResolvedValue({ ok: true, json: async () => body } as Response);
    vi.stubGlobal('fetch', f);

    const result = await getDeezerSubscription('pl1');

    const [url, init] = f.mock.calls[0];
    expect(url).toContain('/Cadence/Deezer/Subscription');
    expect(url).toContain('userId=user-1');
    expect(url).toContain('playlistId=pl1');
    expect((init as RequestInit).headers).toMatchObject({
      Authorization: 'MediaBrowser Token="tok"',
    });
    expect(result).toEqual(body);
  });

  it('returns null on a 404 (not a Deezer subscription)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 } as Response));
    expect(await getDeezerSubscription('pl1')).toBeNull();
  });

  it('returns null with no session (no fetch)', async () => {
    setSession(null);
    const f = vi.fn();
    vi.stubGlobal('fetch', f);
    expect(await getDeezerSubscription('pl1')).toBeNull();
    expect(f).not.toHaveBeenCalled();
  });

  it('returns null on a transport error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    expect(await getDeezerSubscription('pl1')).toBeNull();
  });
});
