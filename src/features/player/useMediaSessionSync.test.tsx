import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useMediaSessionSync } from './useMediaSessionSync';
import { setSession } from '../../lib/sessionStore';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const track: JellyfinItem = { Id: 't', Name: 'S', Type: 'Audio', Artists: ['A'] };
const handlers = { play: vi.fn(), pause: vi.fn(), next: vi.fn(), prev: vi.fn() };

describe('useMediaSessionSync', () => {
  afterEach(() => {
    // @ts-expect-error clean up
    delete navigator.mediaSession;
    setSession(null);
    vi.unstubAllGlobals();
  });

  it('no-ops safely when MediaSession is unavailable', () => {
    expect(() => renderHook(() => useMediaSessionSync(track, true, handlers))).not.toThrow();
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
    Object.defineProperty(navigator, 'mediaSession', {
      value: { metadata: null, playbackState: 'none', setActionHandler },
      configurable: true,
    });
    renderHook(() => useMediaSessionSync(track, true, handlers));
    expect(navigator.mediaSession.metadata).toBeTruthy();
    expect(navigator.mediaSession.playbackState).toBe('playing');
    expect(setActionHandler).toHaveBeenCalled();
  });
});
