import type { JellyfinItem } from '../../lib/jellyfinTypes';

/**
 * Merge the "highlights" shown above the full audiobook list: in-progress
 * (resumable) books first — they're what you're most likely to resume — then
 * favorited books not already in that set. Deduped by id, order preserved. Pure
 * so it's unit-testable.
 */
export function mergeHighlights(
  resumable: JellyfinItem[],
  favorites: JellyfinItem[],
): JellyfinItem[] {
  const seen = new Set(resumable.map((b) => b.Id));
  return [...resumable, ...favorites.filter((b) => !seen.has(b.Id))];
}
