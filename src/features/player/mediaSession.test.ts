import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { bindMediaSessionHandlers, setNowPlaying, setPlaybackState } from './mediaSession';
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
      value: { metadata: null, playbackState: 'none', setActionHandler: vi.fn() },
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

  it('binds the transport handlers', () => {
    const handlers = { play: vi.fn(), pause: vi.fn(), next: vi.fn(), prev: vi.fn() };
    bindMediaSessionHandlers(handlers);
    const set = navigator.mediaSession.setActionHandler as ReturnType<typeof vi.fn>;
    expect(set).toHaveBeenCalledWith('play', handlers.play);
    expect(set).toHaveBeenCalledWith('nexttrack', handlers.next);
  });
});
