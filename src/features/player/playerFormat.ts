import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** Format seconds as m:ss (e.g. 75 → "1:15"). Negatives/NaN clamp to "0:00". */
export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/** A chapter start as a compact human label — "1h30m" / "45m" / "12s" — instead
 * of m:ss (so a 90-minute mark reads "1h30m", not "90:00"). Drops zero parts;
 * negatives/NaN clamp to "0s". */
export function chapterTimestamp(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0s';
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return m > 0 ? `${h}h${m}m` : `${h}h`;
  if (m > 0) return s > 0 ? `${m}m${s}s` : `${m}m`;
  return `${s}s`;
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

/** A run time in whole minutes as Spotify-style words: "48 min" under an hour,
 * "1 hr 5 min" / "28 hr" above it (the minutes part is dropped when it's zero). */
export function durationWords(totalMinutes: number): string {
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hrs = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return mins > 0 ? `${hrs} hr ${mins} min` : `${hrs} hr`;
}

/** A collection summary like "12 songs • 48 min" or "463 songs • 27 hr 4 min"
 * (duration dropped when unknown). */
export function collectionSummary(tracks: JellyfinItem[]): string {
  const count = tracks.length;
  const label = `${count} ${count === 1 ? 'song' : 'songs'}`;
  const ticks = tracks.reduce((sum, t) => sum + (t.RunTimeTicks ?? 0), 0);
  if (ticks <= 0) return label;
  const mins = Math.round(ticks / 10_000_000 / 60);
  return `${label} • ${durationWords(mins)}`;
}
