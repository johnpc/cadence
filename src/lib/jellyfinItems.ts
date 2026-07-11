/**
 * Thin typed reads/writes over the Jellyfin item endpoints. Each is a few lines
 * calling `request`; feature `xApi.ts` modules wrap these in react-query.
 */
import { request } from './jellyfinFetch';
import { getSession } from './sessionStore';
import { dedupeTracks } from './dedupeTracks';
import { dedupeByName } from './dedupeByName';
import type { ItemsResponse, JellyfinItem } from './jellyfinTypes';

const audioFields =
  'Artists,AlbumArtist,Album,AlbumId,ArtistItems,IndexNumber,ParentIndexNumber,RunTimeTicks';

/** A single item (album, artist, track) with its display fields, including
 * genres + production year for the detail-page meta line. */
export async function getItem(itemId: string): Promise<JellyfinItem> {
  const userId = getSession()?.userId ?? '';
  // CanDelete tells us whether the current user OWNS this item (true only for
  // owners) — the playlist page uses it to offer Clone vs edit/delete.
  return request<JellyfinItem>(`/Users/${userId}/Items/${itemId}?Fields=Genres,Overview,CanDelete`);
}

/** All audio tracks on an album, in disc+track order. Uses AlbumIds, not
 * ParentId: some albums (e.g. where the songs live under a different container)
 * return nothing for ParentId+Recursive but resolve correctly by AlbumIds. The
 * limit covers even large box sets (a 200-cap would silently drop later discs). */
export async function getItemTracks(albumId: string, limit = 1000): Promise<JellyfinItem[]> {
  const userId = getSession()?.userId ?? '';
  const params = new URLSearchParams({
    AlbumIds: albumId,
    IncludeItemTypes: 'Audio',
    Recursive: 'true',
    SortBy: 'ParentIndexNumber,IndexNumber,SortName',
    Limit: String(limit),
    Fields: audioFields,
    userId,
  });
  const res = await request<ItemsResponse>(`/Items?${params.toString()}`);
  return dedupeTracks(res.Items);
}

/** A Jellyfin "instant mix" (radio) seeded from any item — Spotify-style. */
export async function getInstantMix(itemId: string, limit = 50): Promise<JellyfinItem[]> {
  const userId = getSession()?.userId ?? '';
  const params = new URLSearchParams({ Limit: String(limit), Fields: audioFields, userId });
  const res = await request<ItemsResponse>(`/Items/${itemId}/InstantMix?${params.toString()}`);
  return res.Items;
}

/** The user's favorites of one type, most-recent first. Limits are high enough
 * to cover a full collection (a 200-cap would silently hide items past #200). */
async function getFavorites(itemType: string, fields: string, limit: number) {
  const userId = getSession()?.userId ?? '';
  const params = new URLSearchParams({
    IncludeItemTypes: itemType,
    Recursive: 'true',
    Filters: 'IsFavorite',
    SortBy: 'DateCreated',
    SortOrder: 'Descending',
    Limit: String(limit),
    Fields: fields,
    userId,
  });
  const res = await request<ItemsResponse>(`/Items?${params.toString()}`);
  return res.Items;
}

/** The user's liked songs (the Liked Songs list is virtualized, so a big result
 * still renders fast). */
export async function getFavoriteSongs(limit = 1000): Promise<JellyfinItem[]> {
  return getFavorites('Audio', audioFields, limit);
}

/** The user's saved albums, most-recent first. */
export async function getFavoriteAlbums(limit = 500): Promise<JellyfinItem[]> {
  return dedupeByName(await getFavorites('MusicAlbum', 'AlbumArtist,Artists', limit));
}

/** Add a track to the user's liked songs. */
export async function addFavorite(itemId: string): Promise<void> {
  const userId = getSession()?.userId ?? '';
  await request(`/Users/${userId}/FavoriteItems/${itemId}`, { method: 'POST' });
}

/** Remove a track from the user's liked songs. */
export async function removeFavorite(itemId: string): Promise<void> {
  const userId = getSession()?.userId ?? '';
  await request(`/Users/${userId}/FavoriteItems/${itemId}`, { method: 'DELETE' });
}

/** Hydrate item ids into full items, preserving the caller's order (e.g. ranked similar-album ids). */
export async function getItemsByIds(ids: string[]): Promise<JellyfinItem[]> {
  if (ids.length === 0) return [];
  const userId = getSession()?.userId ?? '';
  const params = new URLSearchParams({ Ids: ids.join(','), Fields: 'AlbumArtist,Artists', userId });
  const res = await request<ItemsResponse>(`/Items?${params.toString()}`);
  const byId = new Map(res.Items.map((i) => [i.Id, i]));
  return ids.map((id) => byId.get(id)).filter((i): i is JellyfinItem => i !== undefined);
}
