import { describe, expect, it, vi } from 'vitest';

vi.mock('./navidromeFetch', () => ({ request: vi.fn() }));

import { request } from './navidromeFetch';
import { getGenreTracks } from './navidromeGenres';

const mockedRequest = vi.mocked(request);

describe('getGenreTracks', () => {
  it('requests getSongsByGenre with the genre + count', async () => {
    mockedRequest.mockResolvedValue({ songsByGenre: { song: [{ id: 's1', title: 'A' }] } });
    const tracks = await getGenreTracks('Rock', 50);
    expect(request).toHaveBeenCalledWith('/getSongsByGenre', {
      params: { genre: 'Rock', count: 50 },
    });
    expect(tracks).toEqual([expect.objectContaining({ Id: 's1', Name: 'A' })]);
  });
});
