/**
 * Recommendation / discovery reads for the Home shelves. Kept separate from
 * jellyfinItems so both stay under the line limit.
 */
import { request } from './jellyfinFetch';
import { getSession } from './sessionStore';
import type { ItemsResponse, JellyfinItem } from './jellyfinTypes';

const albumFields = 'AlbumArtist,Artists';

/** Recently-added albums ("Recently added" shelf). */
export async function getLatestAlbums(limit = 20): Promise<JellyfinItem[]> {
  const userId = getSession()?.userId ?? '';
  const params = new URLSearchParams({
    IncludeItemTypes: 'MusicAlbum',
    Limit: String(limit),
    Fields: albumFields,
  });
  // /Users/{id}/Items/Latest returns a bare array, not an Items envelope.
  return request<JellyfinItem[]>(`/Users/${userId}/Items/Latest?${params.toString()}`);
}

/** Suggested songs ("Suggested for you" shelf). */
export async function getSuggestedSongs(limit = 20): Promise<JellyfinItem[]> {
  const userId = getSession()?.userId ?? '';
  const params = new URLSearchParams({
    userId,
    type: 'Audio',
    limit: String(limit),
    Fields: 'Artists,AlbumArtist,Album,AlbumId,ArtistItems,RunTimeTicks',
  });
  const res = await request<ItemsResponse>(`/Items/Suggestions?${params.toString()}`);
  return res.Items;
}
