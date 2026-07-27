/**
 * The swappable search backend. Native search hits Navidrome's Subsonic
 * search3 (+ a client-side playlist filter — see lib/navidromeSearch.ts); a
 * marlin/Meilisearch adapter can replace it — the rest of the feature
 * (useSearch, Search.tsx) never changes.
 */
import { marlinConfigured } from '../../lib/marlinStore';
import { marlinProxyEnabled } from '../../lib/runtimeConfig';
import { marlinSearchSource } from './marlinSource';
import { navidromeSearchSource } from '../../lib/navidromeSearch';
import type { SearchSource } from './searchTypes';

export type { SearchSource } from './searchTypes';
export { marlinSearchSource } from './marlinSource';
export { navidromeSearchSource } from '../../lib/navidromeSearch';

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
      return navidromeSearchSource(query, limit);
    }
  }
  return navidromeSearchSource(query, limit);
};
