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

/** A track's run time (m:ss) from Jellyfin's .NET ticks, or '' when unknown. */
export function trackDuration(ticks: number | undefined): string {
  if (!ticks || ticks <= 0) return '';
  return formatTime(ticks / 10_000_000);
}

/** A collection summary like "12 songs • 48 min" (duration dropped when unknown). */
export function collectionSummary(tracks: JellyfinItem[]): string {
  const count = tracks.length;
  const label = `${count} ${count === 1 ? 'song' : 'songs'}`;
  const ticks = tracks.reduce((sum, t) => sum + (t.RunTimeTicks ?? 0), 0);
  if (ticks <= 0) return label;
  const mins = Math.round(ticks / 10_000_000 / 60);
  return `${label} • ${mins} min`;
}
