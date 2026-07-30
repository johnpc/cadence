/**
 * Playback progress reporting to Jellyfin (Sessions/Playing endpoints). This is
 * what makes tracks count as "played" — driving play counts, Recently Played,
 * and cross-client Now Playing. Fire-and-forget: reporting must never disrupt
 * actual playback, so failures are swallowed.
 */
import { request } from './jellyfinFetch';
import { getSession } from './sessionStore';

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

/**
 * Persist the resume position DIRECTLY on the item's per-user data. The
 * `/Sessions/Playing/*` endpoints only save a position inside a real
 * stream-authorized play session — for audiobooks that dropped the position
 * silently (verified live: Sessions/Progress returned 204 but saved 0, while
 * this UserData write persists), so "resume where you left off" never worked.
 * Best-effort; needs the current user id from the session store.
 */
export async function savePlaybackPosition(itemId: string, positionSeconds: number): Promise<void> {
  const userId = getSession()?.userId;
  if (!userId) return;
  try {
    await request(`/Users/${userId}/Items/${itemId}/UserData`, {
      method: 'POST',
      body: { PlaybackPositionTicks: Math.max(0, Math.round(positionSeconds * SECONDS_TO_TICKS)) },
    });
  } catch {
    // Best-effort; never disrupt playback.
  }
}
