import { getItem } from '../../lib/jellyfinItems';
import { resumeSeconds } from './resumePosition';
import { isAudiobook } from './isAudiobook';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/**
 * The position (seconds) an audiobook should resume from, read LIVE from the
 * server rather than the item the player holds. The queue is persisted as a
 * frozen snapshot (queuePersistence) whose `UserData` is never rewritten as
 * playback advances — while real progress is saved server-side every 10s
 * (savePlaybackPosition). So on relaunch the snapshot's position is stale
 * (usually 0), and trusting it makes a resumed book start over. We re-read the
 * item's fresh UserData and reuse the pure resumeSeconds rules (played / barely
 * started / near-end guards). null for music, or when the read fails we fall
 * back to whatever the snapshot carried.
 */
export async function liveResumeSeconds(
  item: JellyfinItem,
  durationSeconds: number,
): Promise<number | null> {
  if (!isAudiobook(item)) return null;
  try {
    const fresh = await getItem(item.Id);
    return resumeSeconds({ ...item, UserData: fresh.UserData }, durationSeconds);
  } catch {
    return resumeSeconds(item, durationSeconds);
  }
}
