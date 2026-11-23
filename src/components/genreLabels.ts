/**
 * Turn raw Jellyfin genre strings into the chips a header shows. Library
 * metadata is messy: audiobook genres arrive as colon-separated category paths
 * ("Science Fiction & Fantasy:Fantasy:Myths & Legends"), sometimes with HTML
 * entities left in ("&amp;"), and music tags can carry stray numbers ("17").
 *
 * Each chip shows the most specific segment of its path, but still LINKS to the
 * genre exactly as Jellyfin stores it — the genre page queries by that string,
 * so a shortened link would find nothing. Duplicates (by label, ignoring case)
 * and number-only tags are dropped, and at most `max` chips are kept.
 */
export interface GenreChip {
  /** What the chip says. */
  label: string;
  /** The genre exactly as stored — the genre page's key. */
  genre: string;
}

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
};

/** Decode the handful of HTML entities that leak into tag metadata. */
export function decodeEntities(text: string): string {
  return text.replace(/&(amp|lt|gt|quot|apos|#39);/g, (m) => ENTITIES[m] ?? m);
}

/** The label for one genre string: its last non-empty path segment. */
export function genreLabel(genre: string): string {
  const segments = decodeEntities(genre)
    .split(':')
    .map((s) => s.trim())
    .filter(Boolean);
  return segments[segments.length - 1] ?? '';
}

export function genreChips(genres: string[] | undefined, max = 4): GenreChip[] {
  const seen = new Set<string>();
  const chips: GenreChip[] = [];
  for (const genre of genres ?? []) {
    const label = genreLabel(genre);
    const key = label.toLowerCase();
    if (!label || /^\d+$/.test(label) || seen.has(key)) continue;
    seen.add(key);
    chips.push({ label, genre });
    if (chips.length === max) break;
  }
  return chips;
}
