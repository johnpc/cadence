import { afterEach, describe, expect, it, vi } from 'vitest';
import { getGenreTracks } from './jellyfinGenres';
import { setSession } from './sessionStore';

describe('jellyfinGenres', () => {
  afterEach(() => {
    setSession(null);
    vi.restoreAllMocks();
  });

  it('getGenreTracks requests audio for the genre, most-played first', async () => {
    setSession({ token: 't', userId: 'uid' });
    const f = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ Items: [{ Id: 's', Name: 'x', Type: 'Audio' }] }),
    } as Response);
    vi.stubGlobal('fetch', f);
    const items = await getGenreTracks('Hip-Hop');
    expect(items).toHaveLength(1);
    const [url] = f.mock.calls[0];
    expect(url).toContain('Genres=Hip-Hop');
    expect(url).toContain('IncludeItemTypes=Audio');
    expect(url).toContain('SortBy=PlayCount');
  });
});
