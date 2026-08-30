import { useEffect } from 'react';
import {
  bindMediaSessionHandlers,
  setNowPlaying,
  setPlaybackState,
  setPositionState,
  type MediaSessionHandlers,
} from './mediaSession';
import { hasNowPlayingBridge } from '../nowplaying/nowPlayingBridge';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** Keep the OS now-playing UI in sync with the player, and bind its controls.
 * `position`/`duration` (seconds) drive the lock-screen scrubber via
 * setPositionState — they tick fast, but it's a cheap native call and no React
 * re-render happens here.
 *
 * On the native iOS app, METADATA publishing stands down: the native Now
 * Playing bridge owns MPNowPlayingInfoCenter (the durable registration that
 * survives pause/background and wins the Bluetooth-reconnect resume), and the
 * web MediaSession writing metadata/position too would clobber it. But the
 * HANDLERS stay bound even on native: WebKit auto-registers its own Now Playing
 * claim whenever the <audio> element plays (that can't be disabled), so the OS
 * has two candidate owners and races them — and when WebKit's claim wins, the
 * lock-screen buttons route to the WEB MediaSession handlers. Leaving those
 * unbound made the buttons land on nothing (the "next/prev sometimes dead"
 * bug). Both owners drive the same player and iOS delivers each press to only
 * one of them, so double handling can't occur. */
export function useMediaSessionSync(
  current: JellyfinItem | null,
  isPlaying: boolean,
  handlers: MediaSessionHandlers,
  position: number,
  duration: number,
) {
  const native = hasNowPlayingBridge();
  useEffect(() => {
    if (native) return;
    setNowPlaying(current);
  }, [native, current]);
  useEffect(() => {
    if (native) return;
    setPlaybackState(isPlaying);
  }, [native, isPlaying]);
  useEffect(() => {
    bindMediaSessionHandlers(handlers);
  }, [handlers]);
  useEffect(() => {
    if (native) return;
    setPositionState(position, duration);
  }, [native, position, duration]);
}
