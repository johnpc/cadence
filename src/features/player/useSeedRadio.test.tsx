import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/jellyfinItems', () => ({ getInstantMix: vi.fn(), getItemTracks: vi.fn() }));
import { getInstantMix, getItemTracks } from '../../lib/jellyfinItems';
import { PlayerContext } from './PlayerContext';
import { useSeedRadio } from './useSeedRadio';
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
  const { result } = renderHook(() => useSeedRadio(), { wrapper });
  return { seedRadio: result.current, playQueue, addToQueue };
}

describe('useSeedRadio', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("plays the album's own tracks immediately, then extends with the mix", async () => {
    vi.mocked(getItemTracks).mockResolvedValue([track('a1'), track('a2')]);
    vi.mocked(getInstantMix).mockResolvedValue([track('m1'), track('m2')]);
    const { seedRadio, playQueue, addToQueue } = setup();
    await seedRadio('al');
    // Album tracks play at once (no waiting on the slow mix).
    expect(playQueue).toHaveBeenCalledWith([track('a1'), track('a2')], 0);
    // The mix is appended behind them in the background.
    await waitFor(() => expect(addToQueue).toHaveBeenCalledWith([track('m1'), track('m2')]));
  });

  it('falls back to just the mix when the album has no tracks', async () => {
    vi.mocked(getItemTracks).mockResolvedValue([]);
    vi.mocked(getInstantMix).mockResolvedValue([track('m1')]);
    const { seedRadio, playQueue } = setup();
    await seedRadio('al');
    expect(playQueue).toHaveBeenCalledWith([track('m1')], 0);
  });

  it('does nothing when neither tracks nor mix return anything', async () => {
    vi.mocked(getItemTracks).mockResolvedValue([]);
    vi.mocked(getInstantMix).mockResolvedValue([]);
    const { seedRadio, playQueue } = setup();
    await seedRadio('al');
    expect(playQueue).not.toHaveBeenCalled();
  });
});
