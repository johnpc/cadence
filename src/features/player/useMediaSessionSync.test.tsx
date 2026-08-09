import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useMediaSessionSync } from './useMediaSessionSync';
import { setSession } from '../../lib/sessionStore';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const track: JellyfinItem = { Id: 't', Name: 'S', Type: 'Audio', Artists: ['A'] };
const handlers = { play: vi.fn(), pause: vi.fn(), next: vi.fn(), prev: vi.fn(), seek: vi.fn() };

describe('useMediaSessionSync', () => {
  afterEach(() => {
    // @ts-expect-error clean up
    delete navigator.mediaSession;
    setSession(null);
    vi.unstubAllGlobals();
  });

  it('no-ops safely when MediaSession is unavailable', () => {
    expect(() =>
      renderHook(() => useMediaSessionSync(track, true, handlers, 10, 100)),
    ).not.toThrow();
  });

  it('publishes metadata + state + handlers when available', () => {
    setSession({ token: 't', userId: 'u' });
    vi.stubGlobal(
      'MediaMetadata',
      class {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        constructor(public d: any) {}
      },
    );
    const setActionHandler = vi.fn();
    const setPositionState = vi.fn();
    Object.defineProperty(navigator, 'mediaSession', {
      value: { metadata: null, playbackState: 'none', setActionHandler, setPositionState },
      configurable: true,
    });
    renderHook(() => useMediaSessionSync(track, true, handlers, 30, 100));
    expect(navigator.mediaSession.metadata).toBeTruthy();
    expect(navigator.mediaSession.playbackState).toBe('playing');
    expect(setActionHandler).toHaveBeenCalled();
    expect(setPositionState).toHaveBeenCalledWith({ duration: 100, position: 30 });
  });

  it('STANDS DOWN when the native Now Playing bridge owns the OS surface', () => {
    // On the native app the MPNowPlayingInfoCenter bridge is the single owner, so
    // the WKWebView's MediaSession must publish nothing (no two owners answering
    // the same lock-screen button).
    (window as unknown as { webkit?: unknown }).webkit = {
      messageHandlers: { cadenceNowPlaying: { postMessage: vi.fn() } },
    };
    const setActionHandler = vi.fn();
    const setPositionState = vi.fn();
    Object.defineProperty(navigator, 'mediaSession', {
      value: { metadata: null, playbackState: 'none', setActionHandler, setPositionState },
      configurable: true,
    });
    renderHook(() => useMediaSessionSync(track, true, handlers, 30, 100));
    expect(navigator.mediaSession.metadata).toBeNull();
    expect(navigator.mediaSession.playbackState).toBe('none');
    expect(setActionHandler).not.toHaveBeenCalled();
    expect(setPositionState).not.toHaveBeenCalled();
    delete (window as unknown as { webkit?: unknown }).webkit;
  });
});
