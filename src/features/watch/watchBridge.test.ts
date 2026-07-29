import { afterEach, describe, expect, it, vi } from 'vitest';
import { hasWatchBridge, pushWatchState } from './watchBridge';
import type { WatchState } from './watchTypes';

const state: WatchState = {
  title: 'Song',
  artist: 'Artist',
  artUrl: null,
  isPlaying: true,
  position: 12,
  duration: 200,
  hasTrack: true,
};

afterEach(() => {
  delete (window as unknown as { webkit?: unknown }).webkit;
});

function installBridge(post = vi.fn()) {
  (window as unknown as { webkit?: unknown }).webkit = {
    messageHandlers: { cadenceWatch: { postMessage: post } },
  };
  return post;
}

describe('watchBridge', () => {
  it('reports no bridge on web', () => {
    expect(hasWatchBridge()).toBe(false);
  });

  it('detects the native bridge when present', () => {
    installBridge();
    expect(hasWatchBridge()).toBe(true);
  });

  it('posts the state as JSON to native', () => {
    const post = installBridge();
    pushWatchState(state);
    expect(post).toHaveBeenCalledWith(JSON.stringify(state));
  });

  it('is a no-op with no bridge', () => {
    expect(() => pushWatchState(state)).not.toThrow();
  });
});
