import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** How many "Made for you" mixes to show. */
export const MIX_COUNT = 6;

/** A personalised mix: an artist to seed an instant-mix radio from, with a
 * Spotify-style "<Artist> Mix" label. */
export interface DailyMix {
  seed: JellyfinItem;
  title: string;
}

/** Distinct artists appearing across a track list, newest-first, as seed items
 * (via each track's ArtistItems). Lets Home derive "Made for you" mixes from
 * what the user actually LISTENS to — not only artists they explicitly follow —
 * so Home is alive even before any curation. Pure + dedup'd by artist id. */
export function artistsFromTracks(tracks: JellyfinItem[]): JellyfinItem[] {
  const seen = new Set<string>();
  const out: JellyfinItem[] = [];
  for (const t of tracks) {
    for (const a of t.ArtistItems ?? []) {
      if (a.Id && a.Name && !seen.has(a.Id)) {
        seen.add(a.Id);
        out.push({ Id: a.Id, Name: a.Name, Type: 'MusicArtist' });
      }
    }
  }
  return out;
}

/** Build "Made for you" mix descriptors from seed artists, preferring the user's
 * followed artists, then filling from listening-derived artists (dedup'd by id).
 * Only artists with an id/name qualify (needed to seed the radio); capped to
 * MIX_COUNT. Pure so the selection stays unit-testable. */
export function buildDailyMixes(
  followed: JellyfinItem[],
  fromListening: JellyfinItem[] = [],
  limit = MIX_COUNT,
): DailyMix[] {
  const seen = new Set<string>();
  const seeds: JellyfinItem[] = [];
  for (const a of [...followed, ...fromListening]) {
    if (a.Id && a.Name && !seen.has(a.Id)) {
      seen.add(a.Id);
      seeds.push(a);
    }
  }
  return seeds.slice(0, limit).map((seed) => ({ seed, title: `${seed.Name} Mix` }));
}
