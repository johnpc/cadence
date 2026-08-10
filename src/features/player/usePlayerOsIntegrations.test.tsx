import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('./usePlayerIntegrations', () => ({ usePlayerIntegrations: vi.fn() }));
vi.mock('../watch/useWatchRemote', () => ({ useWatchRemote: vi.fn() }));
vi.mock('../nowplaying/useNativeNowPlaying', () => ({ useNativeNowPlaying: vi.fn() }));
import { usePlayerIntegrations } from './usePlayerIntegrations';
import { useWatchRemote } from '../watch/useWatchRemote';
import { useNativeNowPlaying } from '../nowplaying/useNativeNowPlaying';
import { usePlayerOsIntegrations } from './usePlayerOsIntegrations';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const track = { Id: 't', Name: 'S', Type: 'Audio' } as JellyfinItem;

describe('usePlayerOsIntegrations', () => {
  it('wires both MediaSession and the watch remote from the shared state', () => {
    const qc = { next: vi.fn(), prev: vi.fn(), toggleShuffle: vi.fn(), cycleRepeat: vi.fn() };
    const ac = {
      toggle: vi.fn(),
      play: vi.fn(),
      pause: vi.fn(),
      seek: vi.fn(),
      seekBy: vi.fn(),
      nudgeVolume: vi.fn(),
      toggleMute: vi.fn(),
    };
    const queue = { tracks: [track, track, track, track, track, track], index: 2 };
    renderHook(() => usePlayerOsIntegrations(track, true, qc, ac, 5, 100, queue));
    expect(usePlayerIntegrations).toHaveBeenCalledWith(track, true, qc, ac, 5, 100);
    expect(useNativeNowPlaying).toHaveBeenCalledWith(
      expect.objectContaining({
        current: track,
        isPlaying: true,
        position: 5,
        duration: 100,
        queueIndex: 2,
        queueCount: 6,
        play: ac.play,
        pause: ac.pause,
        next: qc.next,
        prev: qc.prev,
        seek: ac.seek,
      }),
    );
    expect(useWatchRemote).toHaveBeenCalledWith(
      expect.objectContaining({
        current: track,
        isPlaying: true,
        position: 5,
        duration: 100,
        toggle: ac.toggle,
        seekBy: ac.seekBy,
        next: qc.next,
        prev: qc.prev,
      }),
    );
  });
});
