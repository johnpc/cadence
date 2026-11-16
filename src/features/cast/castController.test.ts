import { afterEach, describe, expect, it, vi } from 'vitest';

const { plugin, isNativePlatform } = vi.hoisted(() => ({
  plugin: {
    initialize: vi.fn().mockResolvedValue(undefined),
    addListener: vi.fn(),
    requestSession: vi.fn().mockResolvedValue({ receiver: { friendlyName: 'Shield' } }),
    loadMedia: vi.fn().mockResolvedValue({}),
    mediaPlay: vi.fn().mockResolvedValue(undefined),
    mediaPause: vi.fn().mockResolvedValue(undefined),
    mediaSeek: vi.fn().mockResolvedValue(undefined),
    sessionStop: vi.fn().mockResolvedValue(undefined),
  },
  isNativePlatform: vi.fn(),
}));
vi.mock('@hauxir2/capacitor-chromecast', () => ({ Chromecast: plugin }));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform } }));
vi.mock('../../lib/jellyfinStream', () => ({
  audioStreamUrl: (id: string) => `https://jf.test/Audio/${id}/universal`,
  imageUrl: () => 'https://jf.test/art.jpg',
}));

import { isCastAvailable, castTrack, castToggle, castSeek, stopCast } from './castController';
import { getCastState, setCastState, CAST_OFF } from './castStore';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const track = { Id: 't1', Name: 'Song', Artists: ['A'] } as JellyfinItem;
const CONNECTED = { status: 'connected', deviceName: 'Shield', playing: true } as const;

describe('castController', () => {
  afterEach(() => {
    vi.clearAllMocks();
    setCastState(CAST_OFF);
    vi.useRealTimers();
  });

  it('is available only on native', () => {
    isNativePlatform.mockReturnValue(true);
    expect(isCastAvailable()).toBe(true);
    isNativePlatform.mockReturnValue(false);
    expect(isCastAvailable()).toBe(false);
  });

  it('requests a session then loads the track stream on first cast', async () => {
    await castTrack(track);
    expect(plugin.requestSession).toHaveBeenCalledOnce();
    expect(getCastState()).toEqual(CONNECTED);
    expect(plugin.loadMedia).toHaveBeenCalledWith(
      expect.objectContaining({ contentId: 'https://jf.test/Audio/t1/universal', autoPlay: true }),
    );
  });

  it('reuses the session on subsequent casts (no second picker)', async () => {
    setCastState(CONNECTED);
    await castTrack(track);
    expect(plugin.requestSession).not.toHaveBeenCalled();
    expect(plugin.loadMedia).toHaveBeenCalledOnce();
  });

  it('castToggle pauses when playing and plays when paused, tracking state', async () => {
    setCastState(CONNECTED);
    await castToggle();
    expect(plugin.mediaPause).toHaveBeenCalledOnce();
    expect(getCastState()).toEqual({ ...CONNECTED, playing: false });
    await castToggle();
    expect(plugin.mediaPlay).toHaveBeenCalledOnce();
    expect(getCastState()).toEqual(CONNECTED);
  });

  it('castSeek proxies to the receiver', async () => {
    await castSeek(42);
    expect(plugin.mediaSeek).toHaveBeenCalledWith({ currentTime: 42 });
  });

  it('stopCast ends the session and clears state', async () => {
    setCastState(CONNECTED);
    await stopCast();
    expect(plugin.sessionStop).toHaveBeenCalledOnce();
    expect(getCastState()).toEqual(CAST_OFF);
  });

  /** A fresh module so the one-time initialize() (which registers the
   * listeners) runs here regardless of test order. */
  async function freshController() {
    vi.resetModules();
    const ctrl = await import('./castController');
    const store = await import('./castStore');
    store.setCastState({ status: 'connected', deviceName: 'Shield', playing: true });
    await ctrl.castTrack(track);
    const call = plugin.addListener.mock.calls.find(([e]) => e === 'SESSION_ENDED');
    expect(call).toBeTruthy();
    return { ctrl, store, sessionEnded: call![1] as () => void };
  }

  it('a TV that drops on its own shows "lost" briefly, then goes off', async () => {
    const { store, sessionEnded, ctrl } = await freshController();
    vi.useFakeTimers();
    sessionEnded();
    expect(store.getCastState()).toEqual({ status: 'lost', deviceName: 'Shield' });
    vi.advanceTimersByTime(ctrl.LOST_NOTICE_MS);
    expect(store.getCastState()).toEqual({ status: 'off' });
  });

  it('a user stop is not reported as lost', async () => {
    const { store, sessionEnded, ctrl } = await freshController();
    plugin.sessionStop.mockImplementationOnce(async () => sessionEnded()); // ends mid-stop
    await ctrl.stopCast();
    expect(store.getCastState()).toEqual({ status: 'off' });
  });

  it('reconnecting during the lost notice is not undone by its timer', async () => {
    const { store, sessionEnded, ctrl } = await freshController();
    vi.useFakeTimers();
    sessionEnded();
    await ctrl.castTrack(track); // picks a TV again
    vi.advanceTimersByTime(ctrl.LOST_NOTICE_MS);
    expect(store.getCastState()).toEqual(CONNECTED);
  });

  it('a session ending while not connected just goes off', async () => {
    const { store, sessionEnded } = await freshController();
    store.setCastState({ status: 'connecting' });
    sessionEnded();
    expect(store.getCastState()).toEqual({ status: 'off' });
  });

  it('mirrors the receiver position from MEDIA_UPDATE into castProgress', async () => {
    vi.resetModules();
    const ctrl = await import('./castController');
    const prog = await import('./castProgress');
    await ctrl.castTrack(track);
    const call = plugin.addListener.mock.calls.find(([e]) => e === 'MEDIA_UPDATE');
    expect(call).toBeTruthy();
    (call![1] as (e: unknown) => void)({ currentTime: 42, media: { duration: 200 } });
    expect(prog.getCastProgress()).toEqual({ position: 42, duration: 200 });
  });

  it('shows connecting while the picker is open, then connected', async () => {
    let pick!: (v: { receiver: { friendlyName: string } }) => void;
    plugin.requestSession.mockImplementationOnce(() => new Promise((res) => (pick = res)));
    const job = castTrack(track);
    await vi.waitFor(() => expect(getCastState()).toEqual({ status: 'connecting' }));
    pick({ receiver: { friendlyName: 'Shield' } });
    await job;
    expect(getCastState()).toEqual(CONNECTED);
  });

  it('goes back to off when the picker is dismissed', async () => {
    plugin.requestSession.mockRejectedValueOnce(new Error('cancelled'));
    await expect(castTrack(track)).rejects.toThrow('cancelled');
    expect(getCastState()).toEqual(CAST_OFF);
    expect(plugin.loadMedia).not.toHaveBeenCalled();
  });

  it('castToggle does nothing without a session', async () => {
    await castToggle();
    expect(plugin.mediaPause).not.toHaveBeenCalled();
    expect(plugin.mediaPlay).not.toHaveBeenCalled();
  });
});
