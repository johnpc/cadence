import { afterEach, describe, expect, it, vi } from 'vitest';
import { jellyfinSearchSource } from './searchSource';
import { setSession } from '../../lib/sessionStore';

describe('jellyfinSearchSource', () => {
  afterEach(() => {
    setSession(null);
    vi.restoreAllMocks();
  });

  it('queries Jellyfin with the search term across song/album/artist types', async () => {
    setSession({ token: 't', userId: 'uid' });
    const f = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ Items: [{ Id: 'a', Name: 'x', Type: 'Audio' }] }),
    } as Response);
    vi.stubGlobal('fetch', f);
    const items = await jellyfinSearchSource('love', 10);
    expect(items).toHaveLength(1);
    const [url] = f.mock.calls[0];
    expect(url).toContain('searchTerm=love');
    expect(url).toContain('IncludeItemTypes=Audio%2CMusicAlbum%2CMusicArtist');
    expect(url).toContain('Limit=10');
  });
});
