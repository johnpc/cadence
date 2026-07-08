import { afterEach, describe, expect, it, vi } from 'vitest';
import { getLatestAlbums, getSuggestedSongs } from './jellyfinDiscover';
import { setSession } from './sessionStore';

function stub(body: unknown) {
  const f = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    text: async () => JSON.stringify(body),
  } as Response);
  vi.stubGlobal('fetch', f);
  return f;
}

describe('jellyfinDiscover', () => {
  afterEach(() => {
    setSession(null);
    vi.restoreAllMocks();
  });

  it('getLatestAlbums hits the Latest endpoint and returns the array', async () => {
    setSession({ token: 't', userId: 'uid' });
    const f = stub([{ Id: 'al', Name: 'A', Type: 'MusicAlbum' }]);
    const albums = await getLatestAlbums(5);
    expect(albums).toHaveLength(1);
    const [url] = f.mock.calls[0];
    expect(url).toContain('/Users/uid/Items/Latest');
    expect(url).toContain('IncludeItemTypes=MusicAlbum');
  });

  it('getSuggestedSongs reads the Suggestions envelope', async () => {
    setSession({ token: 't', userId: 'uid' });
    const f = stub({ Items: [{ Id: 's', Name: 'x', Type: 'Audio' }], TotalRecordCount: 1 });
    const songs = await getSuggestedSongs(5);
    expect(songs).toHaveLength(1);
    const [url] = f.mock.calls[0];
    expect(url).toContain('/Items/Suggestions');
    expect(url).toContain('type=Audio');
  });
});
