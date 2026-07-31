/**
 * The Home-shelves data source. When the CadenceConfig plugin advertises the
 * precomputed endpoint (homeShelvesEnabled), one GET /Cadence/Home returns every
 * shelf — the plugin recomputes them on a schedule, so the client skips ~6 slow
 * recursive Jellyfin library queries (each 2–6s on a large library). When the
 * plugin is absent or the call fails, callers fall back to the native per-shelf
 * queries (see homeApi/libraryApi) — Home always works, just slower without it.
 *
 * This mirrors the searchSource adapter: a one-file swap the rest of the feature
 * never sees. The shelves' shapes match the native reads so hooks are agnostic.
 */
import { request } from '../../lib/jellyfinFetch';
import { getSession } from '../../lib/sessionStore';
import { homeShelvesEnabled } from '../../lib/runtimeConfig';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** The precomputed shelves, one array per Home shelf. Keys match useHomeShelves.
 * NOTE: no followed-artists shelf — favorite-artist resolution can't be served
 * by the plugin's item query (returns empty on Jellyfin), so the client always
 * fetches artists natively via /Artists (see useHomeShelves). */
export interface HomeShelvesData {
  latestAlbums: JellyfinItem[];
  suggestedSongs: JellyfinItem[];
  savedAlbums: JellyfinItem[];
  recentlyPlayed: JellyfinItem[];
  onRepeat: JellyfinItem[];
}

/** Raw plugin response — PascalCase per Jellyfin's serializer. Every field is
 * optional so a partial/older plugin payload degrades to empty shelves, never a
 * throw. */
interface HomeResponse {
  LatestAlbums?: JellyfinItem[];
  SuggestedSongs?: JellyfinItem[];
  SavedAlbums?: JellyfinItem[];
  RecentlyPlayed?: JellyfinItem[];
  OnRepeat?: JellyfinItem[];
}

const arr = (v: JellyfinItem[] | undefined): JellyfinItem[] => (Array.isArray(v) ? v : []);

/** True when the fast plugin path is available. Callers gate their native
 * queries on `!homeSourceEnabled()` so exactly one source runs. */
export function homeSourceEnabled(): boolean {
  return homeShelvesEnabled();
}

/** Fetch all Home shelves from the plugin in one request. Only call when
 * homeSourceEnabled() is true. Throws on network/HTTP error so react-query marks
 * it errored and the caller can fall back. */
export async function fetchHomeShelves(): Promise<HomeShelvesData> {
  // The plugin scopes the shelves to this user (same convention as the app's other
  // Jellyfin calls) — it reads the userId from the query string.
  const userId = getSession()?.userId ?? '';
  const res = await request<HomeResponse>(`/Cadence/Home?userId=${encodeURIComponent(userId)}`);
  return {
    latestAlbums: arr(res.LatestAlbums),
    suggestedSongs: arr(res.SuggestedSongs),
    savedAlbums: arr(res.SavedAlbums),
    recentlyPlayed: arr(res.RecentlyPlayed),
    onRepeat: arr(res.OnRepeat),
  };
}
