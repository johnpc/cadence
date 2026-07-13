/**
 * The optional marlin-search (Meilisearch) backend. Off unless configured — the
 * selector in searchSource.ts picks it and falls back to native Jellyfin search
 * on any error. Two ways to configure it:
 *  - PROXY (preferred, web/PWA): the deploy sets `marlinProxy` and the serving
 *    nginx proxies same-origin `/api/search` to the indexer, injecting the token
 *    server-side. The browser sends NO token and never touches the indexer.
 *  - DIRECT (native, or user-supplied): Settings holds a URL + token (marlinStore)
 *    and the client calls the indexer directly with the token header.
 */
import { getItemsByIds } from '../../lib/jellyfinItems';
import { getMarlinUrl, getMarlinToken } from '../../lib/marlinStore';
import { marlinProxyEnabled } from '../../lib/runtimeConfig';
import type { SearchSource } from './searchTypes';

/** The music item types Cadence searches — marlin indexes the WHOLE Jellyfin
 * library (Movies, Series, Episodes, …), so we must scope to music or a movie
 * whose title matches would pollute the results. */
const MUSIC_TYPES = ['Audio', 'MusicAlbum', 'MusicArtist', 'Playlist'] as const;
const MUSIC_TYPE_SET: ReadonlySet<string> = new Set(MUSIC_TYPES);

/** The search endpoint + headers: the same-origin proxy (no token in the
 * browser) when the deploy enabled it, else the direct indexer URL + token. */
function searchRequest(qs: string): { url: string; init?: RequestInit } {
  if (marlinProxyEnabled()) return { url: `/api/search?${qs}` };
  return {
    url: `${getMarlinUrl()}/search?${qs}`,
    init: { headers: { Authorization: getMarlinToken() } },
  };
}

/** ONE call to the indexer's `/search?q=` returns ranked Jellyfin item ids;
 * hydrate them in a single `/Items?Ids=` call. Two requests vs. the native
 * source's ~3, and Meilisearch ranking beats Jellyfin's substring match.
 * `getItemsByIds` preserves marlin's relevance order.
 *
 * Scoped to music BOTH server-side (marlin's `includeItemTypes` filter) AND after
 * hydration (defence in depth — an older indexer that ignored the param still
 * can't leak a Movie/Series into music results). */
export const marlinSearchSource: SearchSource = async (query, limit = 40) => {
  const params = new URLSearchParams({ q: query });
  for (const t of MUSIC_TYPES) params.append('includeItemTypes', t);
  const { url, init } = searchRequest(params.toString());
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`marlin search failed: ${res.status}`);
  const { ids } = (await res.json()) as { ids?: string[] };
  const hydrated = await getItemsByIds((ids ?? []).slice(0, limit));
  return hydrated.filter((i) => i.Type && MUSIC_TYPE_SET.has(i.Type));
};
