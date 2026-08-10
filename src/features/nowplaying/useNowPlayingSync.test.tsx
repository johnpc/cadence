import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./nowPlayingBridge', () => ({
  hasNowPlayingBridge: vi.fn(),
  pushNowPlayingState: vi.fn(),
}));
vi.mock('../../lib/jellyfinStream', () => ({ imageUrl: (i: { Id: string }) => `art:${i.Id}` }));
vi.mock('../player/playerFormat', () => ({ artistLine: () => 'The Band' }));

import { hasNowPlayingBridge, pushNowPlayingState } from './nowPlayingBridge';
import { useNowPlayingSync } from './useNowPlayingSync';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const track = { Id: 't1', Name: 'Song', Type: 'Audio', Album: 'Album' } as JellyfinItem;

afterEach(() => {
  vi.resetAllMocks();
});

describe('useNowPlayingSync', () => {
  it('does nothing off native (no bridge)', () => {
    vi.mocked(hasNowPlayingBridge).mockReturnValue(false);
    renderHook(() => useNowPlayingSync(track, true, 10, 200, 0, 5));
    expect(pushNowPlayingState).not.toHaveBeenCalled();
  });

  it('pushes now-playing state on native, position rounded, with queue index/count', () => {
    vi.mocked(hasNowPlayingBridge).mockReturnValue(true);
    renderHook(() => useNowPlayingSync(track, true, 10.4, 200, 2, 7));
    expect(pushNowPlayingState).toHaveBeenCalledWith({
      title: 'Song',
      artist: 'The Band',
      album: 'Album',
      artUrl: 'art:t1',
      isPlaying: true,
      position: 10,
      duration: 200,
      hasTrack: true,
      queueIndex: 2,
      queueCount: 7,
    });
  });

  it('clears to an empty state when no track is loaded', () => {
    vi.mocked(hasNowPlayingBridge).mockReturnValue(true);
    renderHook(() => useNowPlayingSync(null, false, 0, 0, 0, 0));
    expect(pushNowPlayingState).toHaveBeenCalledWith(
      expect.objectContaining({ title: '', artUrl: null, hasTrack: false, queueCount: 0 }),
    );
  });

  it('re-pushes when the queue index changes (next track), even at the same second', () => {
    vi.mocked(hasNowPlayingBridge).mockReturnValue(true);
    const { rerender } = renderHook(({ i }) => useNowPlayingSync(track, true, 10, 200, i, 7), {
      initialProps: { i: 2 },
    });
    rerender({ i: 3 }); // advanced to the next track — index change must push
    expect(pushNowPlayingState).toHaveBeenCalledTimes(2);
  });

  it('does not re-push identical state (dedup by value)', () => {
    vi.mocked(hasNowPlayingBridge).mockReturnValue(true);
    const { rerender } = renderHook(({ p }) => useNowPlayingSync(track, true, p, 200, 0, 5), {
      initialProps: { p: 10.1 },
    });
    // Same rounded second → no second push.
    rerender({ p: 10.4 });
    expect(pushNowPlayingState).toHaveBeenCalledTimes(1);
  });
});
