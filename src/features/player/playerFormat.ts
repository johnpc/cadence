import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** Format seconds as m:ss (e.g. 75 → "1:15"). Negatives/NaN clamp to "0:00". */
export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/** The artist line under a track title (joined artists, or the album artist). */
export function artistLine(item: JellyfinItem | null): string {
  if (!item) return '';
  if (item.Artists?.length) return item.Artists.join(', ');
  return item.AlbumArtist ?? '';
}
