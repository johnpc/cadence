import type { QueryClient } from '@tanstack/react-query';
import { requestHomeShelvesRebuild } from './homeSource';

/** Home shelves that are derived from what the user has played. */
export const PLAY_DERIVED_SHELVES: readonly (readonly string[])[] = [
  ['home', 'recently-played'],
  ['home', 'on-repeat'],
  // The plugin fast path serves the same shelves precomputed; it must refresh too.
  ['home', 'plugin-shelves'],
];

/**
 * Refresh the play-derived Home shelves after Jellyfin has recorded a play.
 * Without this, a brand-new listener who plays a track and goes back Home sees
 * no "Recently played"/"On repeat" shelf until the cached (empty) query goes
 * stale — 30 s and 5 min respectively (6 h for the plugin's server-side cache).
 * Background refetch only: nothing is held pending and existing shelf data stays
 * on screen while it refreshes.
 */
export async function refreshPlayDerivedShelves(qc: QueryClient): Promise<void> {
  // Server first (the plugin's precomputed shelves), then the client caches.
  await requestHomeShelvesRebuild();
  await Promise.all(PLAY_DERIVED_SHELVES.map((queryKey) => qc.invalidateQueries({ queryKey })));
}
