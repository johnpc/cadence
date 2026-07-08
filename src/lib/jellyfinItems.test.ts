import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  addFavorite,
  getFavoriteAlbums,
  getFavoriteSongs,
  getInstantMix,
  getItem,
  getItemTracks,
  removeFavorite,
} from './jellyfinItems';
import { setSession } from './sessionStore';

function stubItems(items: unknown[]) {
  const f = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    text: async () => JSON.stringify({ Items: items, TotalRecordCount: items.length }),
  } as Response);
  vi.stubGlobal('fetch', f);
  return f;
}

describe('jellyfinItems', () => {
  afterEach(() => {
    setSession(null);
    vi.restoreAllMocks();
  });

  it('getItem fetches a single item by id for the user', async () => {
    setSession({ token: 't', userId: 'uid' });
    const f = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ Id: 'al', Name: 'Album', Type: 'MusicAlbum' }),
    } as Response);
    vi.stubGlobal('fetch', f);
    const item = await getItem('al');
    expect(item.Name).toBe('Album');
    expect(f.mock.calls[0][0]).toContain('/Users/uid/Items/al');
  });

  it('getItemTracks requests a parent’s tracks in order', async () => {
    setSession({ token: 't', userId: 'uid' });
    const f = stubItems([{ Id: 'a', Name: 'x', Type: 'Audio' }]);
    const items = await getItemTracks('album1');
    expect(items).toHaveLength(1);
    const [url] = f.mock.calls[0];
    expect(url).toContain('ParentId=album1');
    expect(url).toContain('IncludeItemTypes=Audio');
  });

  it('getInstantMix requests a radio seeded from an item', async () => {
    setSession({ token: 't', userId: 'uid' });
    const f = stubItems([{ Id: 'r', Name: 'x', Type: 'Audio' }]);
    const items = await getInstantMix('seed1', 20);
    expect(items).toHaveLength(1);
    const [url] = f.mock.calls[0];
    expect(url).toContain('/Items/seed1/InstantMix');
    expect(url).toContain('Limit=20');
  });

  it('getFavoriteSongs requests liked audio, newest first', async () => {
    setSession({ token: 't', userId: 'uid' });
    const f = stubItems([{ Id: 'a', Name: 'x', Type: 'Audio' }]);
    await getFavoriteSongs();
    const [url] = f.mock.calls[0];
    expect(url).toContain('Filters=IsFavorite');
    expect(url).toContain('IncludeItemTypes=Audio');
  });

  it('getFavoriteAlbums requests saved albums, newest first', async () => {
    setSession({ token: 't', userId: 'uid' });
    const f = stubItems([{ Id: 'al', Name: 'x', Type: 'MusicAlbum' }]);
    await getFavoriteAlbums();
    const [url] = f.mock.calls[0];
    expect(url).toContain('Filters=IsFavorite');
    expect(url).toContain('IncludeItemTypes=MusicAlbum');
  });

  it('addFavorite POSTs to the user favorite endpoint', async () => {
    setSession({ token: 't', userId: 'uid' });
    const f = vi
      .fn()
      .mockResolvedValue({ ok: true, status: 200, text: async () => '' } as Response);
    vi.stubGlobal('fetch', f);
    await addFavorite('song1');
    const [url, init] = f.mock.calls[0];
    expect(url).toContain('/Users/uid/FavoriteItems/song1');
    expect(init.method).toBe('POST');
  });

  it('removeFavorite DELETEs from the user favorite endpoint', async () => {
    setSession({ token: 't', userId: 'uid' });
    const f = vi
      .fn()
      .mockResolvedValue({ ok: true, status: 200, text: async () => '' } as Response);
    vi.stubGlobal('fetch', f);
    await removeFavorite('song1');
    const [url, init] = f.mock.calls[0];
    expect(url).toContain('/Users/uid/FavoriteItems/song1');
    expect(init.method).toBe('DELETE');
  });
});
