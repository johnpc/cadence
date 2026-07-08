/**
 * Playback progress reporting to Jellyfin (Sessions/Playing endpoints). This is
 * what makes tracks count as "played" — driving play counts, Recently Played,
 * and cross-client Now Playing. Fire-and-forget: reporting must never disrupt
 * actual playback, so failures are swallowed.
 */
import { request } from './jellyfinFetch';

const SECONDS_TO_TICKS = 10_000_000;

async function report(path: string, itemId: string, positionSeconds: number): Promise<void> {
  const body = {
    ItemId: itemId,
    PositionTicks: Math.max(0, Math.round(positionSeconds * SECONDS_TO_TICKS)),
  };
  try {
    await request(path, { method: 'POST', body });
  } catch {
    // Reporting is best-effort; never let it break playback.
  }
}

/** Tell Jellyfin a track has started playing. */
export function reportPlaybackStart(itemId: string): Promise<void> {
  return report('/Sessions/Playing', itemId, 0);
}

/** Report the current position (call periodically while playing). */
export function reportPlaybackProgress(itemId: string, positionSeconds: number): Promise<void> {
  return report('/Sessions/Playing/Progress', itemId, positionSeconds);
}

/** Tell Jellyfin a track has stopped (marks it played if near the end). */
export function reportPlaybackStopped(itemId: string, positionSeconds: number): Promise<void> {
  return report('/Sessions/Playing/Stopped', itemId, positionSeconds);
}
