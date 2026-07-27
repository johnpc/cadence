import { describe, expect, it, vi } from 'vitest';

vi.mock('./navidromeFetch', () => ({ request: vi.fn() }));
vi.mock('./navidromePlaylistLists', () => ({ getPlaylistItems: vi.fn() }));

import { request } from './navidromeFetch';
import { getPlaylistItems } from './navidromePlaylistLists';
import { movePlaylistItem } from './navidromePlaylistReorder';

describe('movePlaylistItem', () => {
  it('rebuilds the whole order: removes every current index, re-adds ids in the new order', async () => {
    vi.mocked(getPlaylistItems).mockResolvedValue([
      { Id: 'a', Name: 'A', Type: 'Audio' },
      { Id: 'b', Name: 'B', Type: 'Audio' },
      { Id: 'c', Name: 'C', Type: 'Audio' },
    ]);
    vi.mocked(request).mockResolvedValue({});

    // Move entry at index 0 ('a') to index 2 → new order b, c, a.
    await movePlaylistItem('p1', '0', 2);

    expect(request).toHaveBeenCalledWith('/updatePlaylist', {
      method: 'POST',
      params: {
        playlistId: 'p1',
        songIndexToRemove: [0, 1, 2],
        songIdToAdd: ['b', 'c', 'a'],
      },
    });
  });
});
