import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../lib/platform', () => ({ isIos: vi.fn(() => false) }));
import {
  bindMediaSessionHandlers,
  setNowPlaying,
  setPlaybackState,
  setPositionState,
} from './mediaSession';
import { isIos } from '../../lib/platform';
import { setSession } from '../../lib/sessionStore';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const track: JellyfinItem = {
  Id: 't1',
  Name: 'Song',
  Type: 'Audio',
  Artists: ['A'],
  Album: 'Alb',
  ImageTags: { Primary: 'x' },
};

describe('mediaSession', () => {
  beforeEach(() => {
    setSession({ token: 't', userId: 'u' });
    // jsdom has neither; stub the shapes the module touches.
    vi.stubGlobal(
      'MediaMetadata',
      class {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        constructor(public data: any) {}
      },
    );
    Object.defineProperty(navigator, 'mediaSession', {
      value: {
        metadata: null,
        playbackState: 'none',
        setActionHandler: vi.fn(),
        setPositionState: vi.fn(),
      },
      configurable: true,
    });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    setSession(null);
    // @ts-expect-error clean up the stub
    delete navigator.mediaSession;
  });

  it('publishes now-playing metadata for a track', () => {
    setNowPlaying(track);
    expect(navigator.mediaSession.metadata).toBeTruthy();
  });

  it('publishes artwork at several sizes so the OS picks the sharpest', () => {
    setNowPlaying(track);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = navigator.mediaSession.metadata as any;
    expect(data.title).toBe('Song');
    expect(data.artwork.map((a: { sizes: string }) => a.sizes)).toEqual([
      '96x96',
      '192x192',
      '384x384',
      '512x512',
    ]);
    expect(data.artwork.every((a: { src: string }) => a.src.length > 0)).toBe(true);
  });

  it('clears metadata when nothing is playing', () => {
    setNowPlaying(null);
    expect(navigator.mediaSession.metadata).toBeNull();
  });

  it('reflects the playback state', () => {
    setPlaybackState(true);
    expect(navigator.mediaSession.playbackState).toBe('playing');
    setPlaybackState(false);
    expect(navigator.mediaSession.playbackState).toBe('paused');
  });

  it('binds the transport + seek handlers', () => {
    const handlers = { play: vi.fn(), pause: vi.fn(), next: vi.fn(), prev: vi.fn(), seek: vi.fn() };
    bindMediaSessionHandlers(handlers);
    const set = navigator.mediaSession.setActionHandler as ReturnType<typeof vi.fn>;
    expect(set).toHaveBeenCalledWith('play', handlers.play);
    expect(set).toHaveBeenCalledWith('nexttrack', handlers.next);
    // seekto/seekbackward/seekforward are wired (as functions, not the raw fn).
    for (const action of ['seekto', 'seekbackward', 'seekforward']) {
      expect(set.mock.calls.some((c) => c[0] === action && typeof c[1] === 'function')).toBe(true);
    }
  });

  it('on iOS, leaves ±skip (seek) buttons unset so the lock screen shows track skip', () => {
    vi.mocked(isIos).mockReturnValue(true);
    bindMediaSessionHandlers({
      play: vi.fn(),
      pause: vi.fn(),
      next: vi.fn(),
      prev: vi.fn(),
      seek: vi.fn(),
    });
    const set = navigator.mediaSession.setActionHandler as ReturnType<typeof vi.fn>;
    // Track skip stays wired...
    expect(set).toHaveBeenCalledWith('nexttrack', expect.any(Function));
    expect(set).toHaveBeenCalledWith('previoustrack', expect.any(Function));
    // ...but the ±skip handlers are explicitly cleared (null) on iOS.
    expect(set).toHaveBeenCalledWith('seekbackward', null);
    expect(set).toHaveBeenCalledWith('seekforward', null);
  });

  it('seekto calls seek with the requested absolute time', () => {
    const seek = vi.fn();
    bindMediaSessionHandlers({ play: vi.fn(), pause: vi.fn(), next: vi.fn(), prev: vi.fn(), seek });
    const set = navigator.mediaSession.setActionHandler as ReturnType<typeof vi.fn>;
    const seekto = set.mock.calls.find((c) => c[0] === 'seekto')?.[1] as (e: {
      seekTime?: number;
    }) => void;
    seekto({ seekTime: 42 });
    expect(seek).toHaveBeenCalledWith(42);
  });

  it('publishes a clamped, finite position state (and skips invalid durations)', () => {
    const sps = navigator.mediaSession.setPositionState as ReturnType<typeof vi.fn>;
    setPositionState(30, 200);
    expect(sps).toHaveBeenCalledWith({ duration: 200, position: 30 });
    sps.mockClear();
    setPositionState(10, 0); // no duration yet → don't publish
    expect(sps).not.toHaveBeenCalled();
    setPositionState(250, 200); // position past the end → clamped
    expect(sps).toHaveBeenCalledWith({ duration: 200, position: 200 });
  });
});
