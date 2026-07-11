import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/jellyfinItems', () => ({ getInstantMix: vi.fn() }));
import { getInstantMix } from '../../lib/jellyfinItems';
import { PlayerContext } from './PlayerContext';
import { useSeedRadio } from './useSeedRadio';
import type { PlayerContextValue } from './types';
import type { JellyfinItem } from '../../lib/jellyfinTypes';
import type { ReactNode } from 'react';

const track = (id: string): JellyfinItem => ({ Id: id, Name: id, Type: 'Audio' });

function setup() {
  const playQueue = vi.fn();
  const player = { playQueue } as unknown as PlayerContextValue;
  const wrapper = ({ children }: { children: ReactNode }) => (
    <PlayerContext.Provider value={player}>{children}</PlayerContext.Provider>
  );
  const { result } = renderHook(() => useSeedRadio(), { wrapper });
  return { seedRadio: result.current, playQueue };
}

describe('useSeedRadio', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('plays an instant mix seeded on the id', async () => {
    vi.mocked(getInstantMix).mockResolvedValue([track('x'), track('y')]);
    const { seedRadio, playQueue } = setup();
    await seedRadio('al');
    expect(getInstantMix).toHaveBeenCalledWith('al');
    expect(playQueue).toHaveBeenCalledWith([track('x'), track('y')], 0);
  });

  it('does nothing when the mix is empty', async () => {
    vi.mocked(getInstantMix).mockResolvedValue([]);
    const { seedRadio, playQueue } = setup();
    await seedRadio('al');
    expect(playQueue).not.toHaveBeenCalled();
  });
});
