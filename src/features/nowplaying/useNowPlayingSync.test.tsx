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
    renderHook(() => useNowPlayingSync(track, true, 10, 200));
    expect(pushNowPlayingState).not.toHaveBeenCalled();
  });

  it('pushes now-playing state on native, position rounded', () => {
    vi.mocked(hasNowPlayingBridge).mockReturnValue(true);
    renderHook(() => useNowPlayingSync(track, true, 10.4, 200));
    expect(pushNowPlayingState).toHaveBeenCalledWith({
      title: 'Song',
      artist: 'The Band',
      album: 'Album',
      artUrl: 'art:t1',
      isPlaying: true,
      position: 10,
      duration: 200,
      hasTrack: true,
    });
  });

  it('clears to an empty state when no track is loaded', () => {
    vi.mocked(hasNowPlayingBridge).mockReturnValue(true);
    renderHook(() => useNowPlayingSync(null, false, 0, 0));
    expect(pushNowPlayingState).toHaveBeenCalledWith(
      expect.objectContaining({ title: '', artUrl: null, hasTrack: false }),
    );
  });

  it('does not re-push identical state (dedup by value)', () => {
    vi.mocked(hasNowPlayingBridge).mockReturnValue(true);
    const { rerender } = renderHook(({ p }) => useNowPlayingSync(track, true, p, 200), {
      initialProps: { p: 10.1 },
    });
    // Same rounded second → no second push.
    rerender({ p: 10.4 });
    expect(pushNowPlayingState).toHaveBeenCalledTimes(1);
  });
});
