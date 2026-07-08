import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** How many recommendations show at once. Dismissing one reveals the next
 * unused candidate from the pool, so the pool is fetched larger than this. */
export const REC_VISIBLE = 5;

/** Pick the recommendations to show: candidates that aren't already in the
 * playlist, haven't been dismissed, and haven't just been added — de-duped and
 * capped to `limit`. Pure so the ranking stays unit-testable. */
export function selectRecommendations(
  candidates: JellyfinItem[],
  existingIds: Set<string>,
  hiddenIds: Set<string>,
  limit = REC_VISIBLE,
): JellyfinItem[] {
  const seen = new Set<string>();
  const out: JellyfinItem[] = [];
  for (const track of candidates) {
    if (!track.Id) continue;
    if (existingIds.has(track.Id) || hiddenIds.has(track.Id) || seen.has(track.Id)) continue;
    seen.add(track.Id);
    out.push(track);
    if (out.length >= limit) break;
  }
  return out;
}
