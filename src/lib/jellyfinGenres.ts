/** Genre reads — tracks tagged with a given music genre, for the genre pages. */
import { request } from './jellyfinFetch';
import { getSession } from './sessionStore';
import type { ItemsResponse, JellyfinItem } from './jellyfinTypes';

const audioFields =
  'Artists,AlbumArtist,Album,AlbumId,ArtistItems,IndexNumber,ParentIndexNumber,RunTimeTicks';

/** Audio tracks tagged with `genre`, most-played first — the Spotify-style
 * genre page. Genre is matched by name (Jellyfin's genre ids are unstable). */
export async function getGenreTracks(genre: string, limit = 100): Promise<JellyfinItem[]> {
  const userId = getSession()?.userId ?? '';
  const params = new URLSearchParams({
    Genres: genre,
    IncludeItemTypes: 'Audio',
    Recursive: 'true',
    SortBy: 'PlayCount,SortName',
    SortOrder: 'Descending',
    Limit: String(limit),
    Fields: audioFields,
    userId,
  });
  const res = await request<ItemsResponse>(`/Items?${params.toString()}`);
  return res.Items;
}
