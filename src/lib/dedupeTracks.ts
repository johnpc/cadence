import type { MediaItem } from './navidromeTypes';

/**
 * Some albums are stored with every track duplicated (two file encodings), so
 * a fetch returns each song twice. Collapse to one per slot:
 * key on disc+track number when present (ParentIndexNumber/IndexNumber), else
 * on the track name. First occurrence wins, preserving sort order.
 */
export function dedupeTracks(tracks: MediaItem[]): MediaItem[] {
  const seen = new Set<string>();
  const out: MediaItem[] = [];
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
