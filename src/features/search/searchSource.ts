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
import { marlinConfigured } from '../../lib/marlinStore';
import { marlinProxyEnabled } from '../../lib/runtimeConfig';
import { marlinSearchSource } from './marlinSource';
import type { ItemsResponse, JellyfinItem } from '../../lib/jellyfinTypes';
import type { SearchSource } from './searchTypes';

export type { SearchSource } from './searchTypes';
export { marlinSearchSource } from './marlinSource';

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

/** Native Jellyfin playlist search. Exported because marlin can't index/rank
 * playlists well, so the marlin source fetches playlists natively even when it's
 * the active backend (see marlinSource). */
export async function searchPlaylists(query: string, limit: number): Promise<JellyfinItem[]> {
  const userId = getSession()?.userId ?? '';
  const params = new URLSearchParams({
    searchTerm: query,
    IncludeItemTypes: 'Playlist',
    Recursive: 'true',
    Limit: String(limit),
    userId,
  });
  const res = await request<ItemsResponse>(`/Items?${params.toString()}`);
  return res.Items;
}

/** Jellyfin native search across songs + albums (Items), artists (Artists),
 * and playlists (queried separately so a flood of songs can't crowd them out). */
export const jellyfinSearchSource: SearchSource = async (query, limit = 40) => {
  const [items, artists, playlists] = await Promise.all([
    searchItems(query, limit),
    searchArtists(query, 10),
    searchPlaylists(query, 10),
  ]);
  return [...items, ...artists, ...playlists];
};

/** The active source: marlin ONLY when the user has configured a URL (Settings
 * or an env default) — off by default. Marlin falls back to native search on any
 * error, so a search never hard-fails if the indexer/index is down. Decided per
 * call so configuring it takes effect without a reload. */
export const searchSource: SearchSource = async (query, limit) => {
  // Marlin is active when the deploy enabled the same-origin proxy OR the user
  // configured a direct URL in Settings.
  if (marlinProxyEnabled() || marlinConfigured()) {
    try {
      return await marlinSearchSource(query, limit);
    } catch {
      return jellyfinSearchSource(query, limit);
    }
  }
  return jellyfinSearchSource(query, limit);
};
