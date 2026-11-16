import { watch } from '../../../lib/store';
import { currentTrack } from '../queue';
import { isAudiobook } from '../../audiobook/isAudiobook';
import {
  beaconPlaybackPosition,
  reportPlaybackProgress,
  reportPlaybackStart,
  reportPlaybackStopped,
  savePlaybackPosition,
} from '../../../lib/jellyfinPlayback';
import type { PlayerEngine, PlayerState } from '../engine/types';

export const REPORT_INTERVAL_MS = 10_000;

/** The Jellyfin play-report calls (injectable for tests). */
export interface ReportApi {
  start(id: string): Promise<void>;
  progress(id: string, seconds: number): Promise<void>;
  stopped(id: string, seconds: number): Promise<void>;
  save(id: string, seconds: number): Promise<void>;
  beacon(id: string, seconds: number): boolean;
}

const jellyfinReports: ReportApi = {
  start: reportPlaybackStart,
  progress: reportPlaybackProgress,
  stopped: reportPlaybackStopped,
  save: savePlaybackPosition,
  beacon: beaconPlaybackPosition,
};

/** The id of the track whose LOCAL audio is running, if any. A cast does not
 * count: the local position is 0 then, and a Stopped-at-0 would reset an
 * audiobook's saved place on the server. */
const audibleId = (s: PlayerState): string | null =>
  s.status === 'playing' || s.status === 'buffering' ? (currentTrack(s.queue)?.Id ?? null) : null;

/**
 * Report playback to Jellyfin so tracks count as played (play counts, Recently
 * Played, On repeat). Start fires the moment a track ACTUALLY plays — a track
 * restored paused at launch reports nothing, because Jellyfin resets the saved
 * resume position on any Progress/Stopped report. Then Progress every 10 s, and
 * Stopped when the current track changes or the player detaches.
 *
 * Audiobooks also write their position to UserData — strictly AFTER the report
 * it accompanies (the report zeroes it) — and beacon it on pagehide, so closing
 * the app keeps the place. `onReported` fires once Start has landed: the moment
 * play-derived Home shelves are actually new.
 */
export function attachPlaybackReporting(
  engine: Pick<PlayerEngine, 'state' | 'position'>,
  onReported: () => void,
  api: ReportApi = jellyfinReports,
): () => void {
  let session: { id: string; audiobook: boolean; timer: ReturnType<typeof setInterval> } | null =
    null;
  const onHide = () => {
    const pos = engine.position();
    if (session?.audiobook && pos > 0) api.beacon(session.id, pos);
  };

  const finish = () => {
    if (!session) return;
    const { id, audiobook, timer } = session;
    session = null;
    clearInterval(timer);
    window.removeEventListener('pagehide', onHide);
    const pos = engine.position();
    const stopped = Promise.resolve(api.stopped(id, pos));
    if (audiobook && pos > 0)
      void stopped.then(
        () => api.save(id, pos),
        () => undefined,
      );
  };

  const begin = (id: string) => {
    const audiobook = isAudiobook(currentTrack(engine.state.get().queue));
    const timer = setInterval(() => {
      const pos = engine.position();
      if (pos <= 0) return;
      const progress = Promise.resolve(api.progress(id, pos));
      if (audiobook)
        void progress.then(
          () => api.save(id, pos),
          () => undefined,
        );
    }, REPORT_INTERVAL_MS);
    session = { id, audiobook, timer };
    window.addEventListener('pagehide', onHide);
    void Promise.resolve(api.start(id)).then(onReported, () => undefined);
  };

  const off = watch(
    engine.state,
    (s) => ({ currentId: currentTrack(s.queue)?.Id ?? null, audible: audibleId(s) }),
    ({ currentId, audible }) => {
      if (session && session.id !== currentId) finish();
      if (audible && !session) begin(audible);
    },
    {
      immediate: true,
      equals: (a, b) => a.currentId === b.currentId && a.audible === b.audible,
    },
  );
  return () => {
    off();
    finish();
  };
}
