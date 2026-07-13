/**
 * Artist reads — the albums belonging to an artist, for the artist detail page.
 */
import { request } from './jellyfinFetch';
import { getSession } from './sessionStore';
import { dedupeByName } from './dedupeByName';
import { dedupeByTitle } from './dedupeByTitle';
import type { ItemsResponse, JellyfinItem } from './jellyfinTypes';

/** All albums credited to an artist, newest first. */
export async function getArtistAlbums(artistId: string, limit = 100): Promise<JellyfinItem[]> {
  const userId = getSession()?.userId ?? '';
  const params = new URLSearchParams({
    AlbumArtistIds: artistId,
    IncludeItemTypes: 'MusicAlbum',
    Recursive: 'true',
    SortBy: 'PremiereDate,ProductionYear,SortName',
    SortOrder: 'Descending',
    Limit: String(limit),
    Fields: 'AlbumArtist,Artists,ChildCount',
    userId,
  });
  const res = await request<ItemsResponse>(`/Items?${params.toString()}`);
  return res.Items;
}

/** The user's followed artists (Jellyfin favorites), alphabetically. Uses the
 * dedicated /Artists endpoint — the generic /Items?IncludeItemTypes=MusicArtist
 * favorites filter silently returns nothing for artists on this server. */
export async function getFavoriteArtists(limit = 200): Promise<JellyfinItem[]> {
  const userId = getSession()?.userId ?? '';
  const params = new URLSearchParams({
    Filters: 'IsFavorite',
    SortBy: 'SortName',
    Limit: String(limit),
    userId,
  });
  const res = await request<ItemsResponse>(`/Artists?${params.toString()}`);
  return dedupeByName(res.Items);
}

/** Hydrate a set of artist ids into full items (name + image), preserving the
 * caller's order. Turns ranked related-artist ids into display cards. */
export async function getArtistsByIds(ids: string[]): Promise<JellyfinItem[]> {
  if (ids.length === 0) return [];
  const userId = getSession()?.userId ?? '';
  const params = new URLSearchParams({ Ids: ids.join(','), Fields: 'Genres', userId });
  const res = await request<ItemsResponse>(`/Items?${params.toString()}`);
  const byId = new Map(res.Items.map((a) => [a.Id, a]));
  return ids.map((id) => byId.get(id)).filter((a): a is JellyfinItem => a !== undefined);
}

/** An artist's most-played tracks ("Popular"). */
export async function getArtistTopTracks(artistId: string, limit = 5): Promise<JellyfinItem[]> {
  const userId = getSession()?.userId ?? '';
  // Over-fetch so we can collapse cross-album duplicates (a song + its live /
  // remaster / single copies) and still fill `limit` distinct tracks. The
  // PlayCount ordering is the popularity signal (the popular-tracks plugin
  // re-orders it by real Last.fm ranking server-side).
  const params = new URLSearchParams({
    ArtistIds: artistId,
    IncludeItemTypes: 'Audio',
    Recursive: 'true',
    SortBy: 'PlayCount,SortName',
    SortOrder: 'Descending',
    Limit: String(Math.max(limit * 4, 20)),
    Fields: 'Artists,AlbumArtist,Album,AlbumId,ArtistItems,RunTimeTicks',
    userId,
  });
  const res = await request<ItemsResponse>(`/Items?${params.toString()}`);
  // Dedupe by title (preferring the studio version over live/alt) so "Popular"
  // never shows the same song twice, then trim to the requested count.
  return dedupeByTitle(res.Items).slice(0, limit);
}

/** Every track by an artist, A–Z — the "See all" list behind the Popular
 * section's short preview. Sorted by name (a full alphabetical catalogue reads
 * better than play-count for browsing). */
export async function getArtistTracks(artistId: string, limit = 500): Promise<JellyfinItem[]> {
  const userId = getSession()?.userId ?? '';
  const params = new URLSearchParams({
    ArtistIds: artistId,
    IncludeItemTypes: 'Audio',
    Recursive: 'true',
    SortBy: 'SortName',
    SortOrder: 'Ascending',
    Limit: String(limit),
    Fields: 'Artists,AlbumArtist,Album,AlbumId,ArtistItems,RunTimeTicks',
    userId,
  });
  const res = await request<ItemsResponse>(`/Items?${params.toString()}`);
  return res.Items;
}
