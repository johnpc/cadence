import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/navidromeItems', () => ({ getAlbumTracks: vi.fn(), getSimilarSongs: vi.fn() }));
import { getSimilarSongs, getAlbumTracks } from '../../lib/navidromeItems';
import { PlayerContext } from './PlayerContext';
import { usePlayItem } from './usePlayItem';
import type { PlayerContextValue } from './types';
import type { MediaItem } from '../../lib/navidromeTypes';
import type { ReactNode } from 'react';

const track = (id: string): MediaItem => ({ Id: id, Name: id, Type: 'Audio' });

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
    vi.mocked(getAlbumTracks).mockResolvedValue([track('a'), track('b')]);
    const { play, playQueue } = setup();
    await play({ Id: 'al', Name: 'Album', Type: 'MusicAlbum' });
    expect(getAlbumTracks).toHaveBeenCalledWith('al');
    expect(playQueue).toHaveBeenCalledWith([track('a'), track('b')], 0);
  });

  it('starts a similar-songs radio for an artist', async () => {
    vi.mocked(getSimilarSongs).mockResolvedValue([track('x')]);
    const { play, playQueue } = setup();
    await play({ Id: 'ar', Name: 'Artist', Type: 'MusicArtist' });
    expect(getSimilarSongs).toHaveBeenCalledWith('ar');
    expect(playQueue).toHaveBeenCalledWith([track('x')], 0);
  });

  it('falls back to a radio when an album has no tracks', async () => {
    vi.mocked(getAlbumTracks).mockResolvedValue([]);
    vi.mocked(getSimilarSongs).mockResolvedValue([track('r')]);
    const { play, playQueue } = setup();
    await play({ Id: 'al', Name: 'Album', Type: 'MusicAlbum' });
    expect(playQueue).toHaveBeenCalledWith([track('r')], 0);
  });
});
