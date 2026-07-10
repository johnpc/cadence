/**
 * Playlist reads/writes over the Jellyfin playlist endpoints. Split from
 * jellyfinItems to keep both files under the line limit. The list reads
 * (own/public) live in jellyfinPlaylistLists; re-exported here so callers have
 * one playlist import surface.
 */
import { request } from './jellyfinFetch';
import { getSession } from './sessionStore';
import type { ItemsResponse, JellyfinItem } from './jellyfinTypes';

export { getPlaylists, getPublicPlaylists } from './jellyfinPlaylistLists';

/** The tracks in a playlist, in playlist order. The limit is high enough to
 * cover a full playlist (a 200-cap silently hid tracks past #200 on large
 * playlists — e.g. a 463-track one); the row list is virtualized so a big
 * result still renders fast. */
export async function getPlaylistItems(playlistId: string, limit = 1000): Promise<JellyfinItem[]> {
  const userId = getSession()?.userId ?? '';
  const params = new URLSearchParams({
    userId,
    Limit: String(limit),
    Fields: 'Artists,AlbumArtist,Album,AlbumId,ArtistItems',
  });
  const res = await request<ItemsResponse>(`/Playlists/${playlistId}/Items?${params.toString()}`);
  return res.Items;
}

/** Remove an entry from a playlist by its per-entry PlaylistItemId. */
export async function removeFromPlaylist(playlistId: string, entryId: string): Promise<void> {
  const userId = getSession()?.userId ?? '';
  const params = new URLSearchParams({ EntryIds: entryId, userId });
  await request(`/Playlists/${playlistId}/Items?${params.toString()}`, { method: 'DELETE' });
}

/** Delete a playlist entirely. */
export async function deletePlaylist(playlistId: string): Promise<void> {
  await request(`/Items/${playlistId}`, { method: 'DELETE' });
}

/** Rename a playlist via Jellyfin's UpdatePlaylist endpoint (POST /Playlists/{id}). */
export async function renamePlaylist(playlistId: string, name: string): Promise<void> {
  await request(`/Playlists/${playlistId}`, { method: 'POST', body: { Name: name } });
}

/** Read a playlist's visibility. `GET /Playlists/{id}` (owner-only) returns
 * `OpenAccess`: true = public (shows in every user's library + our community
 * shelf, others can clone it), false = private (only the owner's library).
 * Owner-only — only call for playlists the current user owns. */
export async function getPlaylistIsPublic(playlistId: string): Promise<boolean> {
  const res = await request<{ OpenAccess?: boolean }>(`/Playlists/${playlistId}`);
  return res.OpenAccess === true;
}

/** Set a playlist public or private (owner-only). Jellyfin's UpdatePlaylist
 * takes `IsPublic`; flipping it changes cross-user visibility immediately. */
export async function setPlaylistIsPublic(playlistId: string, isPublic: boolean): Promise<void> {
  await request(`/Playlists/${playlistId}`, { method: 'POST', body: { IsPublic: isPublic } });
}

/** Create a new (audio) playlist and return its id. IsPublic:false is CRITICAL —
 * Jellyfin 10.11 defaults new playlists to PUBLIC, which makes them visible in
 * every other user's library (and dumps them into our "From the community"
 * shelf). A user's playlists must be private to them unless they opt in. */
export async function createPlaylist(name: string): Promise<string> {
  const userId = getSession()?.userId ?? '';
  const res = await request<{ Id: string }>('/Playlists', {
    method: 'POST',
    body: { Name: name, UserId: userId, MediaType: 'Audio', IsPublic: false },
  });
  return res.Id;
}

/** Create a playlist pre-populated with `itemIds` (one call — Jellyfin's create
 * endpoint accepts initial Ids). Used to save the queue as a playlist.
 * IsPublic:false for the same reason as createPlaylist (10.11 defaults public). */
export async function createPlaylistWithItems(name: string, itemIds: string[]): Promise<string> {
  const userId = getSession()?.userId ?? '';
  const res = await request<{ Id: string }>('/Playlists', {
    method: 'POST',
    body: { Name: name, UserId: userId, MediaType: 'Audio', Ids: itemIds, IsPublic: false },
  });
  return res.Id;
}

/** Append a track to a playlist. */
export async function addToPlaylist(playlistId: string, itemId: string): Promise<void> {
  const userId = getSession()?.userId ?? '';
  const params = new URLSearchParams({ Ids: itemId, userId });
  await request(`/Playlists/${playlistId}/Items?${params.toString()}`, { method: 'POST' });
}

/** Move a playlist entry (by its PlaylistItemId) to a new zero-based index. */
export async function movePlaylistItem(
  playlistId: string,
  entryId: string,
  newIndex: number,
): Promise<void> {
  await request(`/Playlists/${playlistId}/Items/${entryId}/Move/${newIndex}`, { method: 'POST' });
}
