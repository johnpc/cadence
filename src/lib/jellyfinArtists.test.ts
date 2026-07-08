import { afterEach, describe, expect, it, vi } from 'vitest';
import { getArtistAlbums } from './jellyfinArtists';
import { setSession } from './sessionStore';

describe('jellyfinArtists', () => {
  afterEach(() => {
    setSession(null);
    vi.restoreAllMocks();
  });

  it('getArtistAlbums filters albums by the artist', async () => {
    setSession({ token: 't', userId: 'uid' });
    const f = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ Items: [{ Id: 'al', Name: 'A', Type: 'MusicAlbum' }] }),
    } as Response);
    vi.stubGlobal('fetch', f);
    const albums = await getArtistAlbums('artist1');
    expect(albums).toHaveLength(1);
    const [url] = f.mock.calls[0];
    expect(url).toContain('AlbumArtistIds=artist1');
    expect(url).toContain('IncludeItemTypes=MusicAlbum');
  });
});
