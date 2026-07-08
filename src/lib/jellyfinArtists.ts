/**
 * Artist reads — the albums belonging to an artist, for the artist detail page.
 */
import { request } from './jellyfinFetch';
import { getSession } from './sessionStore';
import { dedupeByName } from './dedupeByName';
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
    Fields: 'AlbumArtist,Artists',
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

/** An artist's most-played tracks ("Popular"). */
export async function getArtistTopTracks(artistId: string, limit = 5): Promise<JellyfinItem[]> {
  const userId = getSession()?.userId ?? '';
  const params = new URLSearchParams({
    ArtistIds: artistId,
    IncludeItemTypes: 'Audio',
    Recursive: 'true',
    SortBy: 'PlayCount,SortName',
    SortOrder: 'Descending',
    Limit: String(limit),
    Fields: 'Artists,AlbumArtist,Album,AlbumId,ArtistItems,RunTimeTicks',
    userId,
  });
  const res = await request<ItemsResponse>(`/Items?${params.toString()}`);
  return res.Items;
}
