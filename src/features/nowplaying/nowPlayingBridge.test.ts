import { afterEach, describe, expect, it, vi } from 'vitest';
import { hasNowPlayingBridge, pushNowPlayingState } from './nowPlayingBridge';
import type { NowPlayingState } from './nowPlayingTypes';

const state: NowPlayingState = {
  title: 'Song',
  artist: 'Artist',
  album: 'Album',
  artUrl: null,
  isPlaying: true,
  position: 12,
  duration: 200,
  hasTrack: true,
  queueIndex: 0,
  queueCount: 3,
};

afterEach(() => {
  delete (window as unknown as { webkit?: unknown }).webkit;
});

function installBridge(post = vi.fn()) {
  (window as unknown as { webkit?: unknown }).webkit = {
    messageHandlers: { cadenceNowPlaying: { postMessage: post } },
  };
  return post;
}

describe('nowPlayingBridge', () => {
  it('reports no bridge on web', () => {
    expect(hasNowPlayingBridge()).toBe(false);
  });

  it('detects the native bridge when present', () => {
    installBridge();
    expect(hasNowPlayingBridge()).toBe(true);
  });

  it('posts the state as JSON to native', () => {
    const post = installBridge();
    pushNowPlayingState(state);
    expect(post).toHaveBeenCalledWith(JSON.stringify(state));
  });

  it('is a no-op with no bridge', () => {
    expect(() => pushNowPlayingState(state)).not.toThrow();
  });

  it('swallows a posting failure', () => {
    installBridge(
      vi.fn(() => {
        throw new Error('nope');
      }),
    );
    expect(() => pushNowPlayingState(state)).not.toThrow();
  });
});
