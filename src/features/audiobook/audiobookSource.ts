/**
 * The audiobook-library data source. When the CadenceConfig plugin advertises the
 * precomputed endpoint (audiobooksSourceEnabled), one GET /Cadence/Audiobooks
 * returns the whole library — the plugin recomputes it on a schedule, so the
 * client skips the slow recursive AudioBook scan getAudiobooks() otherwise runs
 * (up to 5000 files, 4–19s on a large library). When the plugin is absent or the
 * call fails, callers fall back to the native scan (audiobookLibraryApi) — the
 * Audiobooks tab always works, just slower without it.
 *
 * This mirrors the homeSource / searchSource adapters: a one-file swap the rest of
 * the feature never sees. The returned items match the native /Items shape so the
 * grouping (groupBooks) works unchanged. IMPORTANT: only the STATIC catalog is
 * cached (titles/art/grouping/runtimes) — per-book reading progress is overlaid
 * live by the caller from the (native, bounded) resumable query, so a cached
 * UserData never makes a progress bar look stale.
 */
import { request } from '../../lib/jellyfinFetch';
import { getSession } from '../../lib/sessionStore';
import { audiobooksSourceEnabled } from '../../lib/runtimeConfig';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** Raw plugin response — PascalCase per Jellyfin's serializer. `Books` is optional
 * so a partial/older plugin payload degrades to an empty list, never a throw. */
interface AudiobooksResponse {
  Books?: JellyfinItem[];
}

/** True when the fast plugin path is available. Callers gate their native scan on
 * `!audiobookSourceEnabled()` so exactly one source runs. */
export function audiobookSourceEnabled(): boolean {
  return audiobooksSourceEnabled();
}

/** Fetch the whole audiobook library from the plugin in one request. Only call
 * when audiobookSourceEnabled() is true. Throws on network/HTTP error (incl. the
 * 503 cold-miss) so react-query marks it errored and the caller falls back to the
 * native scan. */
export async function fetchAudiobookLibrary(): Promise<JellyfinItem[]> {
  const userId = getSession()?.userId ?? '';
  const res = await request<AudiobooksResponse>(
    `/Cadence/Audiobooks?userId=${encodeURIComponent(userId)}`,
  );
  return Array.isArray(res.Books) ? res.Books : [];
}
