import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  beaconPlaybackPosition,
  reportPlaybackStart,
  reportPlaybackProgress,
  reportPlaybackStopped,
  savePlaybackPosition,
} from './jellyfinPlayback';
import { setSession } from './sessionStore';

function okFetch() {
  const f = vi.fn().mockResolvedValue({ ok: true, status: 204, text: async () => '' } as Response);
  vi.stubGlobal('fetch', f);
  return f;
}

describe('jellyfinPlayback', () => {
  afterEach(() => {
    setSession(null);
    vi.restoreAllMocks();
  });

  it('reportPlaybackStart POSTs to Sessions/Playing at position 0', async () => {
    setSession({ token: 't', userId: 'uid' });
    const f = okFetch();
    await reportPlaybackStart('song1');
    const [url, init] = f.mock.calls[0];
    expect(url).toContain('/Sessions/Playing');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ ItemId: 'song1', PositionTicks: 0 });
  });

  it('reportPlaybackProgress converts seconds to ticks', async () => {
    setSession({ token: 't', userId: 'uid' });
    const f = okFetch();
    await reportPlaybackProgress('song1', 12);
    const [url, init] = f.mock.calls[0];
    expect(url).toContain('/Sessions/Playing/Progress');
    expect(JSON.parse(init.body).PositionTicks).toBe(120_000_000);
  });

  it('reportPlaybackStopped hits the Stopped endpoint', async () => {
    setSession({ token: 't', userId: 'uid' });
    const f = okFetch();
    await reportPlaybackStopped('song1', 30);
    expect(f.mock.calls[0][0]).toContain('/Sessions/Playing/Stopped');
  });

  it('swallows errors so reporting never breaks playback', async () => {
    setSession({ token: 't', userId: 'uid' });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')));
    await expect(reportPlaybackStart('song1')).resolves.toBeUndefined();
  });

  it('savePlaybackPosition writes the resume position to the item UserData', async () => {
    setSession({ token: 't', userId: 'uid' });
    const f = okFetch();
    await savePlaybackPosition('book1', 90);
    const [url, init] = f.mock.calls[0];
    expect(url).toContain('/Users/uid/Items/book1/UserData');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body).PlaybackPositionTicks).toBe(900_000_000);
  });

  it('savePlaybackPosition no-ops without a session (no user id)', async () => {
    setSession(null);
    const f = okFetch();
    await savePlaybackPosition('book1', 90);
    expect(f).not.toHaveBeenCalled();
  });

  it('beaconPlaybackPosition posts the position with keepalive and the auth header', () => {
    setSession({ token: 'tok', userId: 'uid' });
    const f = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('fetch', f);
    expect(beaconPlaybackPosition('book1', 12)).toBe(true);
    const [url, init] = f.mock.calls[0] as [string, RequestInit & { keepalive: boolean }];
    expect(url).toContain('/UserItems/book1/UserData?userId=uid');
    expect(init.keepalive).toBe(true);
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>).Authorization).toContain('Token="tok"');
    expect(init.body).toBe(JSON.stringify({ PlaybackPositionTicks: 120000000 }));
    vi.unstubAllGlobals();
  });

  it('beaconPlaybackPosition is false without a session', () => {
    setSession(null);
    expect(beaconPlaybackPosition('book1', 12)).toBe(false);
  });
});
