import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** How many similar albums to show in "Fans also like". */
export const SIMILAR_LIMIT = 8;

/** Rank the distinct albums appearing across a seed album's instant-mix tracks
 * by how often their tracks co-occur, excluding the seed album itself — the
 * most frequent are the best "fans also like" picks. Pure so the ranking stays
 * unit-testable without the network. */
export function rankSimilarAlbumIds(
  mixTracks: JellyfinItem[],
  seedAlbumId: string,
  limit = SIMILAR_LIMIT,
): string[] {
  const counts = new Map<string, number>();
  for (const track of mixTracks) {
    const id = track.AlbumId;
    if (!id || id === seedAlbumId) continue;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);
}
