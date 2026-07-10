import { renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

const push = vi.fn();
vi.mock('react-router-dom', async (orig) => ({
  ...(await orig<typeof import('react-router-dom')>()),
  useHistory: () => ({ push }),
}));
const playQueue = vi.fn();
vi.mock('../player/usePlayer', () => ({ usePlayer: () => ({ playQueue }) }));

import { useActivateResult } from './useActivateResult';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const wrapper = ({ children }: { children: ReactNode }) => <MemoryRouter>{children}</MemoryRouter>;

function activate(item: JellyfinItem, onPick = vi.fn()) {
  const { result } = renderHook(() => useActivateResult(onPick), { wrapper });
  result.current(item);
  return onPick;
}

describe('useActivateResult', () => {
  it('plays a song', () => {
    const song = { Id: 's', Name: 'Hit', Type: 'Audio' } as JellyfinItem;
    const onPick = activate(song);
    expect(playQueue).toHaveBeenCalledWith([song], 0);
    expect(onPick).toHaveBeenCalledWith(song);
  });

  it('navigates to album/artist/playlist', () => {
    activate({ Id: 'al', Name: 'A', Type: 'MusicAlbum' } as JellyfinItem);
    expect(push).toHaveBeenCalledWith('/album/al');
    activate({ Id: 'ar', Name: 'B', Type: 'MusicArtist' } as JellyfinItem);
    expect(push).toHaveBeenCalledWith('/artist/ar');
    activate({ Id: 'pl', Name: 'C', Type: 'Playlist' } as JellyfinItem);
    expect(push).toHaveBeenCalledWith('/playlist/pl');
  });
});
