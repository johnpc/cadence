import { imageUrl } from '../../../lib/jellyfinStream';
import { artistLine } from '../playerFormat';
import { hasWatchBridge, pushWatchState } from '../../watch/watchBridge';
import { WATCH_COMMAND_EVENT, type WatchState } from '../../watch/watchTypes';
import { onNowPlaying } from './nowPlayingSnapshot';
import type { PlayerEngine } from '../engine/types';

/** Seconds a watch seek-forward/back jumps (audiobook-friendly nudge). */
const SEEK_STEP = 15;

/**
 * The Apple Watch remote: push now-playing state to the watch (via the native
 * WatchConnectivity relay) when it meaningfully changes, and map the watch's
 * `cadence:watch:*` commands onto the engine. Inert off native iOS.
 */
export function attachWatchRemote(engine: PlayerEngine): () => void {
  let last = '';
  const offPush = hasWatchBridge()
    ? onNowPlaying(engine, (snap) => {
        const t = snap.track;
        const state: WatchState = {
          title: t?.Name ?? '',
          artist: t ? artistLine(t) : '',
          artUrl: t ? imageUrl(t, 200) : null,
          isPlaying: snap.isPlaying,
          position: snap.position,
          duration: snap.duration,
          hasTrack: !!t,
        };
        const key = JSON.stringify(state);
        if (key === last) return;
        last = key;
        pushWatchState(state);
      })
    : () => undefined;
  const handlers: Array<[string, () => void]> = [
    [WATCH_COMMAND_EVENT.toggle, engine.toggle],
    [WATCH_COMMAND_EVENT.next, engine.next],
    [WATCH_COMMAND_EVENT.prev, engine.prev],
    [WATCH_COMMAND_EVENT.seekForward, () => engine.seekBy(SEEK_STEP)],
    [WATCH_COMMAND_EVENT.seekBack, () => engine.seekBy(-SEEK_STEP)],
  ];
  handlers.forEach(([evt, fn]) => window.addEventListener(evt, fn));
  return () => {
    offPush();
    handlers.forEach(([evt, fn]) => window.removeEventListener(evt, fn));
  };
}
