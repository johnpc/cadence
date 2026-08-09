import { useEffect } from 'react';
import { NOW_PLAYING_EVENT, NOW_PLAYING_SEEK_EVENT } from './nowPlayingTypes';

/** The player actions the native OS remote (lock screen / Control Center /
 * Bluetooth) can drive. Directional play/pause — never a single toggle — so an
 * explicit OS command can't run the wrong branch after a state desync (the same
 * reasoning as the MediaSession binding). */
export interface NowPlayingActions {
  play: () => void;
  pause: () => void;
  next: () => void;
  prev: () => void;
  /** Absolute seek in seconds (lock-screen scrubber). */
  seek: (seconds: number) => void;
}

/**
 * Handle transport commands from the native MPRemoteCommandCenter. Native
 * dispatches a `cadence:nowplaying:*` DOM event per command (mirroring the watch
 * + audio-interruption bridges); we map each to the player. The seek event
 * carries its target seconds in `detail`. Listeners rebind when the actions
 * change so they always call the live player. No-op off native (events never
 * fire).
 */
export function useNowPlayingCommands(actions: NowPlayingActions): void {
  const { play, pause, next, prev, seek } = actions;
  useEffect(() => {
    const onSeek = (e: Event) => {
      const seconds = (e as CustomEvent<number>).detail;
      if (typeof seconds === 'number') seek(seconds);
    };
    const handlers: Array<[string, EventListener]> = [
      [NOW_PLAYING_EVENT.play, play],
      [NOW_PLAYING_EVENT.pause, pause],
      [NOW_PLAYING_EVENT.next, next],
      [NOW_PLAYING_EVENT.prev, prev],
      [NOW_PLAYING_SEEK_EVENT, onSeek],
    ];
    handlers.forEach(([evt, fn]) => window.addEventListener(evt, fn));
    return () => handlers.forEach(([evt, fn]) => window.removeEventListener(evt, fn));
  }, [play, pause, next, prev, seek]);
}
