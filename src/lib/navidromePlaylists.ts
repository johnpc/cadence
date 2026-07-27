/**
 * Playlist writes over the Subsonic playlist endpoints. The list + single-
 * playlist reads (own/public/getPlaylist/getPlaylistItems) live in
 * navidromePlaylistLists; re-exported here so callers have one playlist
 * import surface.
 */
import { request } from './navidromeFetch';

export {
  getPlaylists,
  getPublicPlaylists,
  getPlaylist,
  getPlaylistItems,
} from './navidromePlaylistLists';
export { movePlaylistItem } from './navidromePlaylistReorder';

/** Remove an entry from a playlist by its array INDEX (PlaylistItemId). */
export async function removeFromPlaylist(playlistId: string, entryId: string): Promise<void> {
  await request('/updatePlaylist', {
    method: 'POST',
    params: { playlistId, songIndexToRemove: Number(entryId) },
  });
}

/** Delete a playlist entirely (owner-only). */
export async function deletePlaylist(playlistId: string): Promise<void> {
  await request('/deletePlaylist', { params: { id: playlistId } });
}

/** Rename a playlist (owner-only). */
export async function renamePlaylist(playlistId: string, name: string): Promise<void> {
  await request('/updatePlaylist', { method: 'POST', params: { playlistId, name } });
}

/** Read a playlist's visibility (owner-only). */
export async function getPlaylistIsPublic(playlistId: string): Promise<boolean> {
  const res = await request<{ playlist: { public?: boolean } }>('/getPlaylist', {
    params: { id: playlistId },
  });
  return res.playlist.public === true;
}

/** Set a playlist public or private (owner-only). */
export async function setPlaylistIsPublic(
  playlistId: string,
  isPublicValue: boolean,
): Promise<void> {
  await request('/updatePlaylist', {
    method: 'POST',
    params: { playlistId, public: isPublicValue },
  });
}

/** Create a playlist (optionally pre-populated with `songId`s — createPlaylist
 * accepts repeated `songId` params, used to save the queue as a playlist).
 * Subsonic's createPlaylist has no public/private flag, so this always
 * follows up with an explicit updatePlaylist public=false —
 * private-by-default regardless of the server's own default. */
async function createAndLockPrivate(params: { name: string; songId?: string[] }): Promise<string> {
  const res = await request<{ playlist: { id: string } }>('/createPlaylist', {
    method: 'POST',
    params,
  });
  await setPlaylistIsPublic(res.playlist.id, false);
  return res.playlist.id;
}

export function createPlaylist(name: string): Promise<string> {
  return createAndLockPrivate({ name });
}

export function createPlaylistWithItems(name: string, itemIds: string[]): Promise<string> {
  return createAndLockPrivate({ name, songId: itemIds });
}

/** Append a track to a playlist. */
export async function addToPlaylist(playlistId: string, itemId: string): Promise<void> {
  await request('/updatePlaylist', {
    method: 'POST',
    params: { playlistId, songIdToAdd: itemId },
  });
}
