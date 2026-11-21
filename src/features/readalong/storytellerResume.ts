import { liveResumeSeconds } from '../audiobook/liveResumeSeconds';
import { isAudiobook } from '../audiobook/isAudiobook';
import { storytellerEnabled } from '../../lib/runtimeConfig';
import { getReadAlongBook, getSharedPosition } from './storytellerApi';
import { decideResume } from './resumeDecision';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/**
 * The engine's `resumeAt` with the Storyteller bridge folded in: when the
 * feature is on and the track is an audiobook, ask the plugin for the shared
 * position alongside the usual live Jellyfin read, and let a newer Storyteller
 * position (a chapter read on the couch) win. Any bridge failure degrades to
 * exactly the pre-existing behaviour — this must never block or break a load.
 */
export async function storytellerResumeSeconds(
  item: JellyfinItem,
  durationSeconds: number,
): Promise<number | null> {
  const local = await liveResumeSeconds(item, durationSeconds);
  if (!storytellerEnabled() || !isAudiobook(item)) return local;
  const [shared, book] = await Promise.all([
    getSharedPosition(item.Id).catch(() => null),
    getReadAlongBook(item.Id).catch(() => null),
  ]);
  const decision = decideResume({
    local,
    shared,
    parts: book?.Parts ?? [],
    itemId: item.Id,
    durationSeconds,
  });
  return decision.source === 'none' ? null : decision.seconds;
}
