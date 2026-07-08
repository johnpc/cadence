import type { JellyfinItem } from './jellyfinTypes';

/** Collapse items sharing a (case-insensitive, trimmed) name to the first seen,
 * preserving order. The library can contain several distinct Jellyfin playlists
 * with identical names, which read as duplicates to the user. */
export function dedupeByName(items: JellyfinItem[]): JellyfinItem[] {
  const seen = new Set<string>();
  const out: JellyfinItem[] = [];
  for (const item of items) {
    const key = item.Name.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}
