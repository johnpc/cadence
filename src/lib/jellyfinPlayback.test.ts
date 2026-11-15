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

  it('beaconPlaybackPosition posts the position with the token in the ApiKey query', () => {
    setSession({ token: 'tok', userId: 'uid' });
    const beacon = vi.fn().mockReturnValue(true);
    vi.stubGlobal('navigator', { sendBeacon: beacon });
    expect(beaconPlaybackPosition('book1', 12)).toBe(true);
    const [url, body] = beacon.mock.calls[0] as [string, Blob];
    expect(url).toContain('/UserItems/book1/UserData?userId=uid&ApiKey=tok');
    expect(body.type).toBe('application/json');
    vi.unstubAllGlobals();
  });

  it('beaconPlaybackPosition is false without a session or sendBeacon', () => {
    setSession(null);
    expect(beaconPlaybackPosition('book1', 12)).toBe(false);
    setSession({ token: 'tok', userId: 'uid' });
    vi.stubGlobal('navigator', {});
    expect(beaconPlaybackPosition('book1', 12)).toBe(false);
    vi.unstubAllGlobals();
  });
});
