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

const songFields = 'Artists,AlbumArtist,Album,AlbumId,ArtistItems,RunTimeTicks';

/** Suggested songs ("Suggested for you" shelf). */
export async function getSuggestedSongs(limit = 20): Promise<JellyfinItem[]> {
  const userId = getSession()?.userId ?? '';
  const params = new URLSearchParams({
    userId,
    type: 'Audio',
    limit: String(limit),
    Fields: songFields,
  });
  const res = await request<ItemsResponse>(`/Items/Suggestions?${params.toString()}`);
  return res.Items;
}

/** Recently-played songs ("Recently played" shelf), most-recent first. */
export async function getRecentlyPlayed(limit = 20): Promise<JellyfinItem[]> {
  const userId = getSession()?.userId ?? '';
  const params = new URLSearchParams({
    IncludeItemTypes: 'Audio',
    Recursive: 'true',
    Filters: 'IsPlayed',
    SortBy: 'DatePlayed',
    SortOrder: 'Descending',
    Limit: String(limit),
    Fields: songFields,
    userId,
  });
  const res = await request<ItemsResponse>(`/Items?${params.toString()}`);
  return res.Items;
}

/** Your most-played tracks ("On repeat" shelf) — per-user PlayCount, highest
 * first. Uses the per-user /Users/{id}/Items so PlayCount is the caller's own
 * count (not a server-wide total). Only played tracks qualify (IsPlayed). */
export async function getOnRepeat(limit = 20): Promise<JellyfinItem[]> {
  const userId = getSession()?.userId ?? '';
  const params = new URLSearchParams({
    IncludeItemTypes: 'Audio',
    Recursive: 'true',
    Filters: 'IsPlayed',
    SortBy: 'PlayCount',
    SortOrder: 'Descending',
    Limit: String(limit),
    Fields: songFields,
  });
  const res = await request<ItemsResponse>(`/Users/${userId}/Items?${params.toString()}`);
  return res.Items;
}
