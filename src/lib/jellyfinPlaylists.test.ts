import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  addToPlaylist,
  createPlaylist,
  createPlaylistWithItems,
  deletePlaylist,
  getPlaylistItems,
  getPlaylists,
  getPublicPlaylists,
  getPlaylistIsPublic,
  setPlaylistIsPublic,
  movePlaylistItem,
  removeFromPlaylist,
  renamePlaylist,
} from './jellyfinPlaylists';
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

const res = (body: unknown, status = 200) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    text: async () => (body === undefined ? '' : JSON.stringify(body)),
  }) as Response;

/** Route the /Items playlist list to `items`, and the owner-only
 * `/Playlists/{id}/Users` check to 200 for `ownedIds` else 403 — so ownership
 * tests exercise the real confirm-via-share-endpoint path. */
function stubOwnership(items: unknown[], ownedIds: string[]) {
  const f = vi.fn((url: string) => {
    const m = url.match(/\/Playlists\/([^/]+)\/Users/);
    if (m) return Promise.resolve(res(undefined, ownedIds.includes(m[1]) ? 200 : 403));
    return Promise.resolve(res({ Items: items, TotalRecordCount: items.length }));
  });
  vi.stubGlobal('fetch', f);
  return f;
}

describe('jellyfinPlaylists', () => {
  afterEach(() => {
    setSession(null);
    vi.restoreAllMocks();
  });

  it('getPlaylists (non-admin) partitions on CanDelete with NO ownership probes', async () => {
    // A normal user can only delete their OWN playlists, so CanDelete IS the
    // ownership signal — no per-playlist /Users fan-out (the perf storm on Home).
    setSession({ token: 't', userId: 'uid', isAdmin: false });
    const f = stubOwnership(
      [
        { Id: 'mine', Name: 'Mine', Type: 'Playlist', CanDelete: true },
        { Id: 'theirs', Name: 'Someone Else', Type: 'Playlist', CanDelete: false },
      ],
      [], // no probe should ever be made
    );
    const items = await getPlaylists();
    expect(items.map((p) => p.Id)).toEqual(['mine']);
    expect(f.mock.calls[0][0]).toContain('Fields=CanDelete');
    // Zero owner-probe requests — that's the whole point of this path.
    expect(f.mock.calls.some(([url]: [string]) => /\/Playlists\/[^/]+\/Users/.test(url))).toBe(
      false,
    );
  });

  it('getPlaylists (ADMIN) confirms ownership via the share endpoint', async () => {
    // An admin sees CanDelete:true on EVERY playlist, so we must probe: 'mine' +
    // 'admincandelete' both have CanDelete true, but only 'mine' passes /Users.
    setSession({ token: 't', userId: 'uid', isAdmin: true });
    const f = stubOwnership(
      [
        { Id: 'mine', Name: 'Mine', Type: 'Playlist', CanDelete: true },
        { Id: 'admincandelete', Name: 'Emily’s', Type: 'Playlist', CanDelete: true },
        { Id: 'theirs', Name: 'Someone Else', Type: 'Playlist', CanDelete: false },
      ],
      ['mine'],
    );
    const items = await getPlaylists();
    expect(items.map((p) => p.Id)).toEqual(['mine']);
    expect(f.mock.calls.some(([url]: [string]) => /\/Playlists\/[^/]+\/Users/.test(url))).toBe(
      true,
    );
  });

  it('getPublicPlaylists returns others playlists NEWEST-FIRST (Descending)', async () => {
    // Admin path exercises ownership confirmation + order preservation together.
    setSession({ token: 't', userId: 'uid', isAdmin: true });
    const f = stubOwnership(
      [
        // Server returns these in DateCreated-Descending order (newest first).
        // 'emily' has CanDelete true (admin) but isn't owned → community, and must
        // stay at the FRONT (regression: it used to sink below CanDelete:false ones).
        { Id: 'emily', Name: 'Emily’s jams', Type: 'Playlist', CanDelete: true },
        { Id: 'mine', Name: 'Mine', Type: 'Playlist', CanDelete: true },
        { Id: 'theirs', Name: 'Community', Type: 'Playlist', CanDelete: false },
      ],
      ['mine'],
    );
    const items = await getPublicPlaylists();
    // Order preserved (newest 'emily' first), owner 'mine' excluded.
    expect(items.map((p) => p.Id)).toEqual(['emily', 'theirs']);
    // Must request newest-first, or the shelf's slice(limit) truncates new shares.
    expect(f.mock.calls[0][0]).toContain('SortBy=DateCreated');
    expect(f.mock.calls[0][0]).toContain('SortOrder=Descending');
  });

  it('getPublicPlaylists (non-admin) excludes own playlists using CanDelete alone', async () => {
    setSession({ token: 't', userId: 'uid', isAdmin: false });
    const f = stubOwnership(
      [
        { Id: 'mine', Name: 'Mine', Type: 'Playlist', CanDelete: true },
        { Id: 'theirs', Name: 'Community', Type: 'Playlist', CanDelete: false },
      ],
      [],
    );
    const items = await getPublicPlaylists();
    expect(items.map((p) => p.Id)).toEqual(['theirs']);
    expect(f.mock.calls.some(([url]: [string]) => /\/Playlists\/[^/]+\/Users/.test(url))).toBe(
      false,
    );
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
    // Must be created PRIVATE — Jellyfin 10.11 defaults playlists to public,
    // which would leak them into every other user's library.
    expect(JSON.parse(init.body).IsPublic).toBe(false);
  });

  it('createPlaylistWithItems POSTs the name and initial ids', async () => {
    setSession({ token: 't', userId: 'uid' });
    const f = stub({ Id: 'q1' });
    const id = await createPlaylistWithItems('My Queue', ['a', 'b']);
    expect(id).toBe('q1');
    const [url, init] = f.mock.calls[0];
    expect(url).toContain('/Playlists');
    expect(init.method).toBe('POST');
    expect(init.body).toContain('My Queue');
    expect(init.body).toContain('a');
    expect(init.body).toContain('b');
    expect(JSON.parse(init.body).IsPublic).toBe(false); // private, not global
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

  it('removeFromPlaylist DELETEs the entry id', async () => {
    setSession({ token: 't', userId: 'uid' });
    const f = stub(undefined, 204);
    await removeFromPlaylist('pl1', 'entry1');
    const [url, init] = f.mock.calls[0];
    expect(url).toContain('/Playlists/pl1/Items');
    expect(url).toContain('EntryIds=entry1');
    expect(init.method).toBe('DELETE');
  });

  it('movePlaylistItem POSTs to the Move endpoint with the new index', async () => {
    setSession({ token: 't', userId: 'uid' });
    const f = stub(undefined, 204);
    await movePlaylistItem('pl1', 'entry1', 2);
    const [url, init] = f.mock.calls[0];
    expect(url).toContain('/Playlists/pl1/Items/entry1/Move/2');
    expect(init.method).toBe('POST');
  });

  it('deletePlaylist DELETEs the playlist item', async () => {
    setSession({ token: 't', userId: 'uid' });
    const f = stub(undefined, 204);
    await deletePlaylist('pl1');
    const [url, init] = f.mock.calls[0];
    expect(url).toContain('/Items/pl1');
    expect(init.method).toBe('DELETE');
  });

  it('renamePlaylist POSTs the new name to the UpdatePlaylist endpoint', async () => {
    setSession({ token: 't', userId: 'uid' });
    const f = stub(undefined, 204);
    await renamePlaylist('pl1', 'New Name');
    const [url, init] = f.mock.calls[0];
    expect(url).toContain('/Playlists/pl1');
    expect(init.method).toBe('POST');
    expect(init.body).toContain('New Name');
  });

  it('getPlaylistIsPublic reads OpenAccess from the playlist DTO', async () => {
    setSession({ token: 't', userId: 'uid' });
    stub({ OpenAccess: true, Shares: [], ItemIds: [] });
    expect(await getPlaylistIsPublic('pl1')).toBe(true);
    stub({ OpenAccess: false });
    expect(await getPlaylistIsPublic('pl1')).toBe(false);
    stub({}); // missing → treat as private
    expect(await getPlaylistIsPublic('pl1')).toBe(false);
  });

  it('setPlaylistIsPublic POSTs IsPublic to the UpdatePlaylist endpoint', async () => {
    setSession({ token: 't', userId: 'uid' });
    const f = stub(undefined, 204);
    await setPlaylistIsPublic('pl1', true);
    const [url, init] = f.mock.calls[0];
    expect(url).toContain('/Playlists/pl1');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body).IsPublic).toBe(true);
  });
});
