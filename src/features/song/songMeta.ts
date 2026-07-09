import { trackDuration } from '../player/playerFormat';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** The "1985 · 3:45" meta line under a song title: release year (when known)
 * then duration, joined with a middle dot. Empty when neither is known. */
export function songMetaLine(song: JellyfinItem | null): string {
  if (!song) return '';
  const parts: string[] = [];
  if (song.ProductionYear) parts.push(String(song.ProductionYear));
  const dur = trackDuration(song.RunTimeTicks);
  if (dur) parts.push(dur);
  return parts.join(' · ');
}

/** Trim prose to a length, cutting on a word boundary and appending an ellipsis
 * when truncated — for the artist-bio snippet on the song page. */
export function clampText(text: string, max: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  const cut = trimmed.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}
