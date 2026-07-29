import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./watchBridge', () => ({ hasWatchBridge: vi.fn(), pushWatchState: vi.fn() }));
vi.mock('../../lib/jellyfinStream', () => ({ imageUrl: (i: { Id: string }) => `art:${i.Id}` }));
vi.mock('../player/playerFormat', () => ({ artistLine: () => 'The Band' }));

import { hasWatchBridge, pushWatchState } from './watchBridge';
import { useWatchSync } from './useWatchSync';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const track = { Id: 't1', Name: 'Song', Type: 'Audio' } as JellyfinItem;

afterEach(() => {
  vi.resetAllMocks();
});

describe('useWatchSync', () => {
  it('does nothing off native (no bridge)', () => {
    vi.mocked(hasWatchBridge).mockReturnValue(false);
    renderHook(() => useWatchSync(track, true, 10, 200));
    expect(pushWatchState).not.toHaveBeenCalled();
  });

  it('pushes now-playing state on native', () => {
    vi.mocked(hasWatchBridge).mockReturnValue(true);
    renderHook(() => useWatchSync(track, true, 10.4, 200));
    expect(pushWatchState).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Song',
        artist: 'The Band',
        artUrl: 'art:t1',
        isPlaying: true,
        position: 10,
        duration: 200,
        hasTrack: true,
      }),
    );
  });

  it('does not re-push when rounded state is unchanged', () => {
    vi.mocked(hasWatchBridge).mockReturnValue(true);
    const { rerender } = renderHook(({ p }) => useWatchSync(track, true, p, 200), {
      initialProps: { p: 10.1 },
    });
    rerender({ p: 10.3 }); // rounds to the same second → no new push
    expect(pushWatchState).toHaveBeenCalledTimes(1);
  });

  it('reports an idle state when nothing is playing', () => {
    vi.mocked(hasWatchBridge).mockReturnValue(true);
    renderHook(() => useWatchSync(null, false, 0, 0));
    expect(pushWatchState).toHaveBeenCalledWith(
      expect.objectContaining({ title: '', hasTrack: false, isPlaying: false }),
    );
  });
});
