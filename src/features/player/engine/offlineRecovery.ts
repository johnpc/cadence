/**
 * What the player does with a track it can't reach because the device is
 * offline and the track isn't downloaded. Retrying is pointless, so it goes
 * straight to the next DOWNLOADED track in the queue — or stops and says that
 * nothing else is downloaded. Shared by the load-error path and by `play()` (a
 * restored, not-downloaded track pressed offline would otherwise do nothing:
 * its load already failed silently at launch, so no new error ever fires).
 */
import { nextPlayableIndex } from './transitions';
import type { EngineCore } from './core';

export interface OfflineRecovery {
  /** Offline, and this track is not on the device. */
  unavailable(trackId: string): boolean;
  /** Move to the next download, or stop with a message when there is none. */
  recover(): void;
}

export function offlineRecovery(
  core: EngineCore,
  jumpTo: (index: number) => void,
): OfflineRecovery {
  const { deps, get, transition } = core;
  return {
    unavailable: (trackId) => deps.availability.offline() && !deps.availability.downloaded(trackId),
    recover: () => {
      const s = get();
      const at = nextPlayableIndex(s.queue, s.repeat === 'all', deps.availability.downloaded);
      if (at === null) {
        deps.notify('You’re offline — nothing else in this queue is downloaded.');
        transition('paused', { intent: false });
        return;
      }
      deps.notify('Not downloaded — skipping to the next download.');
      jumpTo(at);
    },
  };
}
