/**
 * The optional marlin-search (Meilisearch) backend. Off unless the user
 * configures an indexer URL (marlinStore); the selector in searchSource.ts
 * picks it and falls back to native Jellyfin search on any error.
 */
import { getItemsByIds } from '../../lib/jellyfinItems';
import { getMarlinUrl, getMarlinToken } from '../../lib/marlinStore';
import type { SearchSource } from './searchTypes';

/** The music item types Cadence searches — marlin indexes the WHOLE Jellyfin
 * library (Movies, Series, Episodes, …), so we must scope to music or a movie
 * whose title matches would pollute the results. */
const MUSIC_TYPES = ['Audio', 'MusicAlbum', 'MusicArtist', 'Playlist'] as const;
const MUSIC_TYPE_SET: ReadonlySet<string> = new Set(MUSIC_TYPES);

/** ONE call to the configured indexer's `/search?q=` (the user's own URL + token)
 * returns ranked Jellyfin item ids; hydrate them in a single `/Items?Ids=` call.
 * Two requests vs. the native source's ~3, and Meilisearch ranking beats
 * Jellyfin's substring match. `getItemsByIds` preserves marlin's relevance order.
 *
 * Scoped to music BOTH server-side (marlin's `includeItemTypes` filter) AND after
 * hydration (defence in depth — an older indexer that ignored the param still
 * can't leak a Movie/Series into music results). */
export const marlinSearchSource: SearchSource = async (query, limit = 40) => {
  const params = new URLSearchParams({ q: query });
  for (const t of MUSIC_TYPES) params.append('includeItemTypes', t);
  const res = await fetch(`${getMarlinUrl()}/search?${params.toString()}`, {
    headers: { Authorization: getMarlinToken() },
  });
  if (!res.ok) throw new Error(`marlin search failed: ${res.status}`);
  const { ids } = (await res.json()) as { ids?: string[] };
  const hydrated = await getItemsByIds((ids ?? []).slice(0, limit));
  return hydrated.filter((i) => i.Type && MUSIC_TYPE_SET.has(i.Type));
};
