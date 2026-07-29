import { useEffect } from 'react';
import { WATCH_COMMAND_EVENT } from './watchTypes';

/** The player actions the watch remote can drive. */
export interface WatchActions {
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seekBy: (delta: number) => void;
}

/** Seconds a watch seek-forward/back jumps (audiobook-friendly nudge). */
const SEEK_STEP = 15;

/**
 * Handle transport commands sent from the Apple Watch. The native WCSession relay
 * dispatches a `cadence:watch:*` DOM event per command (mirroring the audio-
 * interruption bridge); we map each to the phone player. Listeners are rebound
 * when the actions change so they always call the live player. No-op off native
 * (the events simply never fire).
 */
export function useWatchCommands(actions: WatchActions): void {
  const { toggle, next, prev, seekBy } = actions;
  useEffect(() => {
    const handlers: Array<[string, () => void]> = [
      [WATCH_COMMAND_EVENT.toggle, toggle],
      [WATCH_COMMAND_EVENT.next, next],
      [WATCH_COMMAND_EVENT.prev, prev],
      [WATCH_COMMAND_EVENT.seekForward, () => seekBy(SEEK_STEP)],
      [WATCH_COMMAND_EVENT.seekBack, () => seekBy(-SEEK_STEP)],
    ];
    handlers.forEach(([evt, fn]) => window.addEventListener(evt, fn));
    return () => handlers.forEach(([evt, fn]) => window.removeEventListener(evt, fn));
  }, [toggle, next, prev, seekBy]);
}
