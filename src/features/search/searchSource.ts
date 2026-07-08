/**
 * The swappable search backend. v1 hits Jellyfin's native search; a later slice
 * adds a Marlin/Meilisearch adapter and flips the exported `searchSource` — the
 * rest of the feature (useSearch, Search.tsx) never changes.
 *
 * Songs + albums come from `/Items?searchTerm=`, but artists are NOT returned
 * there — they need the dedicated `/Artists` endpoint — so we query both and
 * merge.
 */
import { request } from '../../lib/jellyfinFetch';
import { getSession } from '../../lib/sessionStore';
import type { ItemsResponse, JellyfinItem } from '../../lib/jellyfinTypes';

export type SearchSource = (query: string, limit?: number) => Promise<JellyfinItem[]>;

async function searchItems(query: string, limit: number): Promise<JellyfinItem[]> {
  const userId = getSession()?.userId ?? '';
  const params = new URLSearchParams({
    searchTerm: query,
    IncludeItemTypes: 'Audio,MusicAlbum',
    Recursive: 'true',
    Limit: String(limit),
    Fields: 'Artists,AlbumArtist,Album,AlbumId,RunTimeTicks',
    userId,
  });
  const res = await request<ItemsResponse>(`/Items?${params.toString()}`);
  return res.Items;
}

async function searchArtists(query: string, limit: number): Promise<JellyfinItem[]> {
  const userId = getSession()?.userId ?? '';
  const params = new URLSearchParams({
    searchTerm: query,
    Recursive: 'true',
    Limit: String(limit),
    userId,
  });
  const res = await request<ItemsResponse>(`/Artists?${params.toString()}`);
  // The Artists endpoint omits Type; tag them so grouping can find them.
  return res.Items.map((a) => ({ ...a, Type: 'MusicArtist' }));
}

/** Jellyfin native search across songs, albums (Items) + artists (Artists). */
export const jellyfinSearchSource: SearchSource = async (query, limit = 40) => {
  const [items, artists] = await Promise.all([searchItems(query, limit), searchArtists(query, 10)]);
  return [...items, ...artists];
};

/** The active source. Swap this line to change backends. */
export const searchSource: SearchSource = jellyfinSearchSource;
