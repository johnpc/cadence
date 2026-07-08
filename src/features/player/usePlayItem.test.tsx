import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/jellyfinItems', () => ({ getItemTracks: vi.fn(), getInstantMix: vi.fn() }));
import { getInstantMix, getItemTracks } from '../../lib/jellyfinItems';
import { PlayerContext } from './PlayerContext';
import { usePlayItem } from './usePlayItem';
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
  const { result } = renderHook(() => usePlayItem(), { wrapper });
  return { play: result.current, playQueue };
}

describe('usePlayItem', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('plays an album by its tracks in order', async () => {
    vi.mocked(getItemTracks).mockResolvedValue([track('a'), track('b')]);
    const { play, playQueue } = setup();
    await play({ Id: 'al', Name: 'Album', Type: 'MusicAlbum' });
    expect(getItemTracks).toHaveBeenCalledWith('al');
    expect(playQueue).toHaveBeenCalledWith([track('a'), track('b')], 0);
  });

  it('starts an instant mix for an artist', async () => {
    vi.mocked(getInstantMix).mockResolvedValue([track('x')]);
    const { play, playQueue } = setup();
    await play({ Id: 'ar', Name: 'Artist', Type: 'MusicArtist' });
    expect(getInstantMix).toHaveBeenCalledWith('ar');
    expect(playQueue).toHaveBeenCalledWith([track('x')], 0);
  });

  it('falls back to a radio when an album has no tracks', async () => {
    vi.mocked(getItemTracks).mockResolvedValue([]);
    vi.mocked(getInstantMix).mockResolvedValue([track('r')]);
    const { play, playQueue } = setup();
    await play({ Id: 'al', Name: 'Album', Type: 'MusicAlbum' });
    expect(playQueue).toHaveBeenCalledWith([track('r')], 0);
  });
});
