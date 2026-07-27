/**
 * Playback progress reporting via Subsonic's scrobble endpoint. This is what
 * makes tracks count as "played" — driving play counts, Recently Played, and
 * cross-client Now Playing. Fire-and-forget: reporting must never disrupt
 * actual playback, so failures are swallowed.
 */
import { request } from './navidromeFetch';

type ScrobbleParams = { id: string; submission: boolean; position?: number; time?: number };

async function scrobble(params: ScrobbleParams): Promise<void> {
  try {
    await request('/scrobble', { params });
  } catch {
    // Reporting is best-effort; never let it break playback.
  }
}

/** Tell the server a track has started playing (updates Now Playing, no
 * play-count side effect — submission=false). */
export function reportPlaybackStart(itemId: string): Promise<void> {
  return scrobble({ id: itemId, submission: false, position: 0 });
}

/** Report the current position in ms (call periodically while playing;
 * submission=false — still just a Now Playing update, not a final scrobble). */
export function reportPlaybackProgress(itemId: string, positionSeconds: number): Promise<void> {
  return scrobble({
    id: itemId,
    submission: false,
    position: Math.max(0, Math.round(positionSeconds * 1000)),
  });
}

/** The final scrobble — marks the track played (increments play count / feeds
 * Recently Played). submission=true with the current epoch time. */
export function reportPlaybackStopped(itemId: string): Promise<void> {
  return scrobble({ id: itemId, submission: true, time: Date.now() });
}
