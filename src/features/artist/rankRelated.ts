import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** How many related artists to show in "Fans also like". */
export const RELATED_LIMIT = 8;

/** Rank the artists appearing across a seed artist's instant-mix tracks by how
 * often they co-occur, excluding the seed itself — the most frequent are the
 * best "fans also like" picks. Pure so the ranking stays unit-testable. */
export function rankRelatedArtistIds(
  mixTracks: JellyfinItem[],
  seedId: string,
  limit = RELATED_LIMIT,
): string[] {
  const counts = new Map<string, number>();
  for (const track of mixTracks) {
    for (const artist of track.ArtistItems ?? []) {
      if (!artist.Id || artist.Id === seedId) continue;
      counts.set(artist.Id, (counts.get(artist.Id) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);
}
