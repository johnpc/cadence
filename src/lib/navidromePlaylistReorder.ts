/**
 * Playlist reordering — split from navidromePlaylists to keep both files
 * under the line limit (this one operation needs the full track list, unlike
 * every other playlist write).
 */
import { request } from './navidromeFetch';
import { getPlaylistItems } from './navidromePlaylistLists';

/** Move a playlist entry (by its array-index PlaylistItemId) to a new
 * zero-based index. Subsonic's updatePlaylist has no single "move" op (only
 * add-by-id / remove-by-index), so this rebuilds the whole order in one call:
 * remove every current index, then re-add every track id in the new order. */
export async function movePlaylistItem(
  playlistId: string,
  entryId: string,
  newIndex: number,
): Promise<void> {
  const tracks = await getPlaylistItems(playlistId);
  const ids = tracks.map((t) => t.Id);
  const [moved] = ids.splice(Number(entryId), 1);
  ids.splice(newIndex, 0, moved);
  await request('/updatePlaylist', {
    method: 'POST',
    params: {
      playlistId,
      songIndexToRemove: tracks.map((_, i) => i),
      songIdToAdd: ids,
    },
  });
}
