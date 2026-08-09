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
 * STANDS DOWN on the native iOS app: when the native Now Playing bridge is
 * present it owns MPNowPlayingInfoCenter + MPRemoteCommandCenter (the durable
 * registration that survives pause/background and wins the Bluetooth-reconnect
 * resume). Publishing to the WKWebView's MediaSession too would give the OS two
 * owners answering the same lock-screen button — so on native we skip entirely
 * and let the native bridge be the single source. The PWA (no bridge) is
 * unchanged. */
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
    if (native) return;
    bindMediaSessionHandlers(handlers);
  }, [native, handlers]);
  useEffect(() => {
    if (native) return;
    setPositionState(position, duration);
  }, [native, position, duration]);
}
