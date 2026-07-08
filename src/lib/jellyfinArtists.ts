/**
 * Artist reads — the albums belonging to an artist, for the artist detail page.
 */
import { request } from './jellyfinFetch';
import { getSession } from './sessionStore';
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
