import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** How many "Made for you" mixes to show. */
export const MIX_COUNT = 6;

/** A personalised mix: an artist to seed an instant-mix radio from, with a
 * Spotify-style "<Artist> Mix" label. */
export interface DailyMix {
  seed: JellyfinItem;
  title: string;
}

/** Turn the user's followed artists into "Made for you" mix descriptors. Only
 * artists with an id qualify (needed to seed the radio); capped to MIX_COUNT.
 * Pure so the selection stays unit-testable. */
export function buildDailyMixes(artists: JellyfinItem[], limit = MIX_COUNT): DailyMix[] {
  return artists
    .filter((a) => a.Id && a.Name)
    .slice(0, limit)
    .map((seed) => ({ seed, title: `${seed.Name} Mix` }));
}
