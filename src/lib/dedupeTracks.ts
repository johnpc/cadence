import type { JellyfinItem } from './jellyfinTypes';

/**
 * Some albums are stored in Jellyfin with every track duplicated (two file
 * encodings), so a fetch returns each song twice. Collapse to one per slot:
 * key on disc+track number when present (ParentIndexNumber/IndexNumber), else
 * on the track name. First occurrence wins, preserving sort order.
 */
export function dedupeTracks(tracks: JellyfinItem[]): JellyfinItem[] {
  const seen = new Set<string>();
  const out: JellyfinItem[] = [];
  for (const t of tracks) {
    const key =
      t.IndexNumber != null
        ? `n:${t.ParentIndexNumber ?? 0}.${t.IndexNumber}`
        : `t:${t.Name.trim().toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}
