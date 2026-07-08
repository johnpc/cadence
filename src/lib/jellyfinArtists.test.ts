import { afterEach, describe, expect, it, vi } from 'vitest';
import { getArtistAlbums, getArtistTopTracks, getFavoriteArtists } from './jellyfinArtists';
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

  it('getArtistTopTracks requests audio by the artist sorted by play count', async () => {
    setSession({ token: 't', userId: 'uid' });
    const f = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ Items: [{ Id: 's', Name: 'x', Type: 'Audio' }] }),
    } as Response);
    vi.stubGlobal('fetch', f);
    const tracks = await getArtistTopTracks('artist1');
    expect(tracks).toHaveLength(1);
    const [url] = f.mock.calls[0];
    expect(url).toContain('ArtistIds=artist1');
    expect(url).toContain('SortBy=PlayCount');
  });

  it('getFavoriteArtists requests followed MusicArtist items', async () => {
    setSession({ token: 't', userId: 'uid' });
    const f = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ Items: [{ Id: 'ar', Name: 'x', Type: 'MusicArtist' }] }),
    } as Response);
    vi.stubGlobal('fetch', f);
    const artists = await getFavoriteArtists();
    expect(artists).toHaveLength(1);
    const [url] = f.mock.calls[0];
    expect(url).toContain('/Artists?');
    expect(url).toContain('Filters=IsFavorite');
  });
});
