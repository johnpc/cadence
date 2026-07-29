import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/jellyfinItems', () => ({ getInstantMix: vi.fn() }));
vi.mock('../library/recentPlays', () => ({ touchRecentPlay: vi.fn() }));
import { getInstantMix } from '../../lib/jellyfinItems';
import { touchRecentPlay } from '../library/recentPlays';
import { PlayerContext } from './PlayerContext';
import { useSongRadio } from './useSongRadio';
import type { PlayerContextValue } from './types';
import type { JellyfinItem } from '../../lib/jellyfinTypes';
import type { ReactNode } from 'react';

const track = (id: string): JellyfinItem => ({ Id: id, Name: id, Type: 'Audio' });

function setup() {
  const playQueue = vi.fn();
  const addToQueue = vi.fn();
  const player = { playQueue, addToQueue } as unknown as PlayerContextValue;
  const wrapper = ({ children }: { children: ReactNode }) => (
    <PlayerContext.Provider value={player}>{children}</PlayerContext.Provider>
  );
  const { result } = renderHook(() => useSongRadio(), { wrapper });
  return { start: result.current, playQueue, addToQueue };
}

describe('useSongRadio', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('plays the seed song immediately, before the slow mix resolves', () => {
    let resolve!: (v: JellyfinItem[]) => void;
    vi.mocked(getInstantMix).mockReturnValue(new Promise((r) => (resolve = r)));
    const { start, playQueue, addToQueue } = setup();
    start(track('seed'));
    // The seed plays right away — no awaiting the (slow) InstantMix.
    expect(playQueue).toHaveBeenCalledWith([track('seed')], 0);
    expect(addToQueue).not.toHaveBeenCalled();
    expect(touchRecentPlay).toHaveBeenCalledWith('seed', expect.any(Number));
    resolve([]);
  });

  it('appends the mix behind the seed, without re-queuing the seed', async () => {
    vi.mocked(getInstantMix).mockResolvedValue([track('seed'), track('a'), track('b')]);
    const { start, addToQueue } = setup();
    start(track('seed'));
    await waitFor(() => expect(addToQueue).toHaveBeenCalled());
    expect(addToQueue).toHaveBeenCalledWith([track('a'), track('b')]);
  });

  it('still plays the seed when the mix fails', async () => {
    vi.mocked(getInstantMix).mockRejectedValue(new Error('offline'));
    const { start, playQueue, addToQueue } = setup();
    start(track('seed'));
    expect(playQueue).toHaveBeenCalledWith([track('seed')], 0);
    await waitFor(() => expect(getInstantMix).toHaveBeenCalled());
    expect(addToQueue).not.toHaveBeenCalled();
  });
});
