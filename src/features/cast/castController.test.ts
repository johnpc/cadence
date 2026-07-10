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
import { getCastState, setCastState } from './castStore';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const track = { Id: 't1', Name: 'Song', Artists: ['A'] } as JellyfinItem;
const DISCONNECTED = { connected: false, deviceName: '', playing: false };

describe('castController', () => {
  afterEach(() => {
    vi.clearAllMocks();
    setCastState(DISCONNECTED);
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
    expect(getCastState()).toEqual({ connected: true, deviceName: 'Shield', playing: true });
    expect(plugin.loadMedia).toHaveBeenCalledWith(
      expect.objectContaining({ contentId: 'https://jf.test/Audio/t1/universal', autoPlay: true }),
    );
  });

  it('reuses the session on subsequent casts (no second picker)', async () => {
    setCastState({ connected: true, deviceName: 'Shield', playing: true });
    await castTrack(track);
    expect(plugin.requestSession).not.toHaveBeenCalled();
    expect(plugin.loadMedia).toHaveBeenCalledOnce();
  });

  it('castToggle pauses when playing and plays when paused, tracking state', async () => {
    setCastState({ connected: true, deviceName: 'Shield', playing: true });
    await castToggle();
    expect(plugin.mediaPause).toHaveBeenCalledOnce();
    expect(getCastState().playing).toBe(false);
    await castToggle();
    expect(plugin.mediaPlay).toHaveBeenCalledOnce();
    expect(getCastState().playing).toBe(true);
  });

  it('castSeek proxies to the receiver', async () => {
    await castSeek(42);
    expect(plugin.mediaSeek).toHaveBeenCalledWith({ currentTime: 42 });
  });

  it('stopCast ends the session and clears state', async () => {
    setCastState({ connected: true, deviceName: 'Shield', playing: true });
    await stopCast();
    expect(plugin.sessionStop).toHaveBeenCalledOnce();
    expect(getCastState().connected).toBe(false);
  });

  it('registers a SESSION_ENDED listener that clears state when the TV disconnects', async () => {
    // Fresh module so the one-time initialize() (which registers the listener)
    // definitely runs here regardless of test order.
    vi.resetModules();
    const ctrl = await import('./castController');
    const store = await import('./castStore');
    store.setCastState({ connected: true, deviceName: 'Shield', playing: true });
    await ctrl.castTrack(track);
    const call = plugin.addListener.mock.calls.find(([e]) => e === 'SESSION_ENDED');
    expect(call).toBeTruthy();
    (call![1] as () => void)();
    expect(store.getCastState().connected).toBe(false);
  });
});
