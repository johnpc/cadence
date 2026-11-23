import { book, list, musicalNotes } from 'ionicons/icons';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/**
 * What to draw when an item has no artwork. It used to be a flat dark disc with
 * a pin-head note glyph (the icon was sized from font-size, so a 140 px card
 * got a 6 px note) — it read as a failed image. Now: a calm two-tone gradient
 * whose hue comes from the item's name (stable, so the same artist always looks
 * the same), with initials on round art (artists, mixes) and a proportionally
 * sized kind icon on square art.
 */
export type ArtPlaceholder =
  { kind: 'initials'; text: string; hue: number } | { kind: 'icon'; icon: string; hue: number };

/** A stable 0–359 hue from a name (FNV-1a, so near-identical names still differ). */
export function artHue(name: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < name.length; i++) {
    h ^= name.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0) % 360;
}

/** Up to two initials: first letters of the first and last words ("Dan Mangan" → "DM"). */
export function artInitials(name: string): string {
  const words = name
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return '';
  const first = words[0][0];
  const last = words.length > 1 ? words[words.length - 1][0] : '';
  return (first + last).toUpperCase();
}

function kindIcon(type: string | undefined): string {
  if (type === 'AudioBook') return book;
  if (type === 'Playlist') return list;
  return musicalNotes;
}

export function artPlaceholder(item: JellyfinItem | null, round: boolean): ArtPlaceholder {
  const name = item?.Name ?? '';
  const hue = artHue(name);
  const text = round ? artInitials(name) : '';
  return text ? { kind: 'initials', text, hue } : { kind: 'icon', icon: kindIcon(item?.Type), hue };
}
