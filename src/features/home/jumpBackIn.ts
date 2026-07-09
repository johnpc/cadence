import type { RecentPlays } from '../library/recentPlays';

/** The most-recently-played collection ids, newest first, capped at `limit`.
 * Pure so the ordering is unit-testable without the store or the network. */
export function topRecentIds(plays: RecentPlays, limit = 10): string[] {
  return Object.entries(plays)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);
}
