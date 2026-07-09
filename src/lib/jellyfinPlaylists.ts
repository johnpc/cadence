/**
 * Playlist reads/writes over the Jellyfin playlist endpoints. Split from
 * jellyfinItems to keep both files under the line limit.
 */
import { request } from './jellyfinFetch';
import { getSession } from './sessionStore';
import { dedupeByName } from './dedupeByName';
import type { ItemsResponse, JellyfinItem } from './jellyfinTypes';

/** The user's playlists, deduped by name (the library can hold several distinct
 * playlists with identical names, which read as duplicates). */
export async function getPlaylists(): Promise<JellyfinItem[]> {
  const userId = getSession()?.userId ?? '';
  const params = new URLSearchParams({
    IncludeItemTypes: 'Playlist',
    Recursive: 'true',
    SortBy: 'SortName',
    userId,
  });
  const res = await request<ItemsResponse>(`/Items?${params.toString()}`);
  return dedupeByName(res.Items);
}

/** The tracks in a playlist, in playlist order (capped for a fast first paint). */
export async function getPlaylistItems(playlistId: string, limit = 200): Promise<JellyfinItem[]> {
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

/** Create a new (audio) playlist and return its id. */
export async function createPlaylist(name: string): Promise<string> {
  const userId = getSession()?.userId ?? '';
  const res = await request<{ Id: string }>('/Playlists', {
    method: 'POST',
    body: { Name: name, UserId: userId, MediaType: 'Audio' },
  });
  return res.Id;
}

/** Create a playlist pre-populated with `itemIds` (one call — Jellyfin's create
 * endpoint accepts initial Ids). Used to save the queue as a playlist. */
export async function createPlaylistWithItems(name: string, itemIds: string[]): Promise<string> {
  const userId = getSession()?.userId ?? '';
  const res = await request<{ Id: string }>('/Playlists', {
    method: 'POST',
    body: { Name: name, UserId: userId, MediaType: 'Audio', Ids: itemIds },
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
