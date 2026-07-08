import { afterEach, describe, expect, it, vi } from 'vitest';
import { addToPlaylist, createPlaylist, getPlaylistItems, getPlaylists } from './jellyfinPlaylists';
import { setSession } from './sessionStore';

function stub(body: unknown, status = 200) {
  const f = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    text: async () => (body === undefined ? '' : JSON.stringify(body)),
  } as Response);
  vi.stubGlobal('fetch', f);
  return f;
}

describe('jellyfinPlaylists', () => {
  afterEach(() => {
    setSession(null);
    vi.restoreAllMocks();
  });

  it('getPlaylists lists playlist items', async () => {
    setSession({ token: 't', userId: 'uid' });
    const f = stub({ Items: [{ Id: 'p', Name: 'PL', Type: 'Playlist' }], TotalRecordCount: 1 });
    const items = await getPlaylists();
    expect(items).toHaveLength(1);
    expect(f.mock.calls[0][0]).toContain('IncludeItemTypes=Playlist');
  });

  it('getPlaylistItems reads a playlist’s tracks', async () => {
    setSession({ token: 't', userId: 'uid' });
    const f = stub({ Items: [{ Id: 'a', Name: 'x', Type: 'Audio' }], TotalRecordCount: 1 });
    await getPlaylistItems('pl1');
    expect(f.mock.calls[0][0]).toContain('/Playlists/pl1/Items');
  });

  it('createPlaylist POSTs and returns the new id', async () => {
    setSession({ token: 't', userId: 'uid' });
    const f = stub({ Id: 'new1' });
    const id = await createPlaylist('My Mix');
    expect(id).toBe('new1');
    const [url, init] = f.mock.calls[0];
    expect(url).toContain('/Playlists');
    expect(init.method).toBe('POST');
    expect(init.body).toContain('My Mix');
  });

  it('addToPlaylist POSTs the item id', async () => {
    setSession({ token: 't', userId: 'uid' });
    const f = stub(undefined, 204);
    await addToPlaylist('pl1', 'song1');
    const [url, init] = f.mock.calls[0];
    expect(url).toContain('/Playlists/pl1/Items');
    expect(url).toContain('Ids=song1');
    expect(init.method).toBe('POST');
  });
});
