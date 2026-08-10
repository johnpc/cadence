import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// Assert this hook delegates to both halves — the sync + the command wiring — so
// PlayerProvider only needs the one call.
vi.mock('./useNowPlayingSync', () => ({ useNowPlayingSync: vi.fn() }));
vi.mock('./useNowPlayingCommands', () => ({ useNowPlayingCommands: vi.fn() }));

import { useNowPlayingSync } from './useNowPlayingSync';
import { useNowPlayingCommands } from './useNowPlayingCommands';
import { useNativeNowPlaying } from './useNativeNowPlaying';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const track = { Id: 't', Name: 'S', Type: 'Audio' } as JellyfinItem;

describe('useNativeNowPlaying', () => {
  it('wires state sync + command handling from one call', () => {
    const deps = {
      current: track,
      isPlaying: true,
      position: 5,
      duration: 100,
      queueIndex: 1,
      queueCount: 4,
      play: vi.fn(),
      pause: vi.fn(),
      next: vi.fn(),
      prev: vi.fn(),
      seek: vi.fn(),
    };
    renderHook(() => useNativeNowPlaying(deps));
    expect(useNowPlayingSync).toHaveBeenCalledWith(track, true, 5, 100, 1, 4);
    expect(useNowPlayingCommands).toHaveBeenCalledWith(
      expect.objectContaining({ play: deps.play, pause: deps.pause, seek: deps.seek }),
    );
  });
});
