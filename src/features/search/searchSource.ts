/**
 * The swappable search backend. v1 hits Jellyfin's native search; a later slice
 * adds a Marlin/Meilisearch adapter and flips the exported `searchSource` — the
 * rest of the feature (useSearch, Search.tsx) never changes.
 */
import { request } from '../../lib/jellyfinFetch';
import { getSession } from '../../lib/sessionStore';
import type { ItemsResponse, JellyfinItem } from '../../lib/jellyfinTypes';

export type SearchSource = (query: string, limit?: number) => Promise<JellyfinItem[]>;

/** Jellyfin native search across songs, albums, and artists. */
export const jellyfinSearchSource: SearchSource = async (query, limit = 40) => {
  const userId = getSession()?.userId ?? '';
  const params = new URLSearchParams({
    searchTerm: query,
    IncludeItemTypes: 'Audio,MusicAlbum,MusicArtist',
    Recursive: 'true',
    Limit: String(limit),
    Fields: 'Artists,AlbumArtist,Album,AlbumId,RunTimeTicks',
    userId,
  });
  const res = await request<ItemsResponse>(`/Items?${params.toString()}`);
  return res.Items;
};

/** The active source. Swap this line to change backends. */
export const searchSource: SearchSource = jellyfinSearchSource;
