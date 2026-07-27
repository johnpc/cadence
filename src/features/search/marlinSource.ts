/**
 * The optional marlin-search (Meilisearch) backend. Off unless configured — the
 * selector in searchSource.ts picks it and falls back to native search on any
 * error. Two ways to configure it:
 *  - PROXY (preferred, web/PWA): the deploy sets `marlinProxy` and the serving
 *    nginx proxies same-origin `/api/search` to the indexer, injecting the token
 *    server-side. The browser sends NO token and never touches the indexer.
 *  - DIRECT (native, or user-supplied): Settings holds a URL + token (marlinStore)
 *    and the client calls the indexer directly with the token header.
 */
import { getSongsByIds, getAlbumsByIds } from '../../lib/navidromeItemsByIds';
import { getArtistsByIds } from '../../lib/navidromeArtists';
import { getMarlinUrl, getMarlinToken } from '../../lib/marlinStore';
import { marlinProxyEnabled } from '../../lib/runtimeConfig';
import { searchPlaylists } from '../../lib/navidromeSearch';
import type { MediaItem } from '../../lib/navidromeTypes';
import type { SearchSource } from './searchTypes';

/** The item types Cadence searches via marlin. Playlists are NOT here — older
 * marlin indexes don't include them at all, so we always fetch playlists via
 * the native name-filter (one cheap read) and merge, making playlist search
 * work regardless of the marlin index state. marlin indexes the WHOLE library
 * (Movies, Series, …) so we still scope tightly to music. */
const MARLIN_TYPES = ['Audio', 'MusicAlbum', 'MusicArtist'] as const;
type MarlinType = (typeof MARLIN_TYPES)[number];

/** How long to wait on the indexer before giving up and letting the selector
 * fall back to native search. Short by design: marlin exists to be FAST, so a
 * hung proxy/indexer must yield quickly rather than leave the user on a spinner
 * (the native fetch's own 30s bound is far too long for interactive search). */
const MARLIN_TIMEOUT_MS = 6000;

/** The search endpoint + headers: the same-origin proxy (no token in the
 * browser) when the deploy enabled it, else the direct indexer URL + token. */
function searchRequest(qs: string): { url: string; init?: RequestInit } {
  if (marlinProxyEnabled()) return { url: `/api/search?${qs}` };
  return {
    url: `${getMarlinUrl()}/search?${qs}`,
    init: { headers: { Authorization: getMarlinToken() } },
  };
}

/** Fetch bounded by MARLIN_TIMEOUT_MS — a stalled indexer aborts (throws) so the
 * selector's catch falls back to native search fast, instead of hanging. */
async function boundedFetch(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), MARLIN_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** Marlin ids for ONE item type. Querying per-type (not all music types in one
 * ranked list) is essential: a shared list ranks songs first and the limit then
 * starves artists/albums entirely (a search like "love" is ~all songs). */
async function marlinIdsFor(type: MarlinType, query: string, limit: number): Promise<string[]> {
  const params = new URLSearchParams({ q: query });
  params.append('includeItemTypes', type);
  const { url, init } = searchRequest(params.toString());
  const res = await boundedFetch(url, init);
  if (!res.ok) throw new Error(`marlin search failed: ${res.status}`);
  const { ids } = (await res.json()) as { ids?: string[] };
  return (ids ?? []).slice(0, limit);
}

/** Hydrate ids by their marlin type — Subsonic has no kind-agnostic
 * batch-by-id endpoint, so each type needs its own fetcher. A stale/deleted
 * id (or one that no longer matches its indexed kind) is dropped, not fatal. */
function hydrate(type: MarlinType, ids: string[]): Promise<MediaItem[]> {
  if (type === 'Audio') return getSongsByIds(ids);
  if (type === 'MusicAlbum') return getAlbumsByIds(ids);
  return getArtistsByIds(ids);
}

/** Query marlin PER music type (so each gets its own slots) + native
 * playlists, all in parallel, then hydrate each type via its own endpoint.
 * Meilisearch ranking beats native substring match; playlists come from the
 * native name-filter since marlin can't rank them. A playlist-fetch failure
 * degrades to no playlists, never a failed search. */
export const marlinSearchSource: SearchSource = async (query, limit = 40) => {
  const perType = Math.max(10, Math.floor(limit / MARLIN_TYPES.length));
  const [hydratedByType, playlists] = await Promise.all([
    Promise.all(MARLIN_TYPES.map(async (t) => hydrate(t, await marlinIdsFor(t, query, perType)))),
    searchPlaylists(query, 10).catch(() => []),
  ]);
  return [...hydratedByType.flat(), ...playlists];
};
