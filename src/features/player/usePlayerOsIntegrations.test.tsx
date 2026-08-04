import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('./usePlayerIntegrations', () => ({ usePlayerIntegrations: vi.fn() }));
vi.mock('../watch/useWatchRemote', () => ({ useWatchRemote: vi.fn() }));
import { usePlayerIntegrations } from './usePlayerIntegrations';
import { useWatchRemote } from '../watch/useWatchRemote';
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
    renderHook(() => usePlayerOsIntegrations(track, true, qc, ac, 5, 100));
    expect(usePlayerIntegrations).toHaveBeenCalledWith(track, true, qc, ac, 5, 100);
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
