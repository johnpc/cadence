/**
 * Playlist reads/writes over the Jellyfin playlist endpoints. Split from
 * jellyfinItems to keep both files under the line limit.
 */
import { request } from './jellyfinFetch';
import { getSession } from './sessionStore';
import type { ItemsResponse, JellyfinItem } from './jellyfinTypes';

/** The user's playlists. */
export async function getPlaylists(): Promise<JellyfinItem[]> {
  const userId = getSession()?.userId ?? '';
  const params = new URLSearchParams({
    IncludeItemTypes: 'Playlist',
    Recursive: 'true',
    SortBy: 'SortName',
    userId,
  });
  const res = await request<ItemsResponse>(`/Items?${params.toString()}`);
  return res.Items;
}

/** The tracks in a playlist, in playlist order. */
export async function getPlaylistItems(playlistId: string): Promise<JellyfinItem[]> {
  const userId = getSession()?.userId ?? '';
  const params = new URLSearchParams({
    userId,
    Fields: 'Artists,AlbumArtist,Album,AlbumId,RunTimeTicks',
  });
  const res = await request<ItemsResponse>(`/Playlists/${playlistId}/Items?${params.toString()}`);
  return res.Items;
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

/** Append a track to a playlist. */
export async function addToPlaylist(playlistId: string, itemId: string): Promise<void> {
  const userId = getSession()?.userId ?? '';
  const params = new URLSearchParams({ Ids: itemId, userId });
  await request(`/Playlists/${playlistId}/Items?${params.toString()}`, { method: 'POST' });
}
