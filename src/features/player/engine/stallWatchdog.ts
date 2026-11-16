import type { AudioLike, LogFn } from './types';

/**
 * Recovery for a stream that stalls forever. The element only fires `error` for
 * hard failures; a stream left pending fires nothing — device diagnostics showed
 * a background track stuck "buffering" until iOS suspended the app (losing the
 * Now Playing slot). The engine arms this exactly while its transport is
 * `buffering`; any progress re-arms it, so only a frozen stream times out. It
 * never acts on a paused element or a user who no longer wants sound.
 */
export interface StallWatchdog {
  arm(): void;
  /** A position update while armed: re-arm only if playback actually moved. */
  progressed(position: number): void;
  disarm(): void;
}

export function createStallWatchdog(
  audio: AudioLike,
  timeoutMs: number,
  wantsSound: () => boolean,
  onStall: () => void,
  log: LogFn,
): StallWatchdog {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let armedAt = -1;
  const disarm = () => {
    if (timer) clearTimeout(timer);
    timer = null;
  };
  const arm = () => {
    disarm();
    armedAt = audio.currentTime;
    timer = setTimeout(() => {
      timer = null;
      if (audio.paused || !wantsSound()) return;
      log('stall-watchdog', 'stalled too long — recovering', {
        waitedMs: String(timeoutMs),
        pos: audio.currentTime.toFixed(1),
      });
      onStall();
    }, timeoutMs);
  };
  return {
    arm,
    disarm,
    progressed: (position) => {
      if (timer && position !== armedAt) arm();
    },
  };
}
