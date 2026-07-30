import type { JellyfinItem } from '../../lib/jellyfinTypes';
import { bookTitle } from './bookTitle';

/**
 * A "book" — one logical audiobook, which may be a single m4b file or many
 * chapter files grouped together. `parts` are the underlying AudioBook items in
 * play order; `book` is the display item (the first part, carrying the title/art
 * for the shelf).
 */
export interface Book {
  /** Stable id for the group (used as a key + route param). */
  id: string;
  /** The representative item for art/artist (the first part). */
  book: JellyfinItem;
  /** The book's display title — see bookTitle for how Album/Name are reconciled. */
  title: string;
  /** The playable parts, in listening order (one entry for a single-file book). */
  parts: JellyfinItem[];
}

/** Order parts within a book: by IndexNumber, then name (a stable tiebreak). */
function byPlayOrder(a: JellyfinItem, b: JellyfinItem): number {
  const ai = a.IndexNumber ?? 0;
  const bi = b.IndexNumber ?? 0;
  if (ai !== bi) return ai - bi;
  return a.Name.localeCompare(b.Name);
}

/**
 * The grouping key for a file. Jellyfin tags the files of one book with a shared
 * `Album`, so that's the primary signal (covers a 332-file book correctly). When
 * a book's files lack an Album tag, fall back to the container folder (ParentId)
 * — but only as a LAST resort, because the shared "audiobooks" root folder holds
 * many distinct single-file books under one ParentId. To avoid fusing those, the
 * ParentId fallback is additionally namespaced by the file's title stem (text
 * before the first digit / " - " / " Part"), so loose single files stay separate
 * while genuine multi-part sets (which share a stem) group.
 */
function groupKey(item: JellyfinItem): string {
  if (item.Album) return `album:${item.Album}`;
  const parent = item.ParentId ?? item.Id;
  return `parent:${parent}:${titleStem(item.Name)}`;
}

/** The leading title text before a part number — "Home Front-Part01" → "home
 * front", "The Stranger 03" → "the stranger". Lets loose files under a shared
 * folder stay separate while a book's parts (same stem) group. */
export function titleStem(name: string): string {
  return name
    .replace(/[-_]?\s*(part|chapter|disc|cd|track)?\s*\d+.*$/i, '')
    .trim()
    .toLowerCase();
}

/**
 * Collapse a flat list of AudioBook files into logical books. Preserves the
 * input order of first-appearance (the server already sorts by SortName), and
 * orders each book's parts by play order.
 */
export function groupBooks(items: JellyfinItem[]): Book[] {
  const groups = new Map<string, JellyfinItem[]>();
  for (const item of items) {
    const key = groupKey(item);
    const list = groups.get(key);
    if (list) list.push(item);
    else groups.set(key, [item]);
  }
  return Array.from(groups.values()).map((parts) => {
    const sorted = [...parts].sort(byPlayOrder);
    return {
      id: sorted[0].Id,
      book: sorted[0],
      title: bookTitle(sorted[0], sorted.length),
      parts: sorted,
    };
  });
}
