import { useEffect } from 'react';
import {
  bindMediaSessionHandlers,
  setNowPlaying,
  setPlaybackState,
  setPositionState,
  type MediaSessionHandlers,
} from './mediaSession';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** Keep the OS now-playing UI in sync with the player, and bind its controls.
 * `position`/`duration` (seconds) drive the lock-screen scrubber via
 * setPositionState — they tick fast, but it's a cheap native call and no React
 * re-render happens here.
 *
 * Publishes EVERYTHING even on the native iOS app (where NowPlayingBridge also
 * writes MPNowPlayingInfoCenter). An app has one Now Playing surface and BOTH
 * writers hit it: WebKit auto-writes whenever the <audio> plays and that cannot
 * be disabled. The previous "stand down on native" made WebKit's write SPARSE
 * (no metadata, no state, no handlers' worth of context) — so when it landed
 * after the native bridge's full dict, the lock screen lost the queue fields
 * and hid next/prev entirely (observed on device: no skip buttons, zero
 * remote-command events). Publishing fully from the web side too means
 * whichever write lands last, the registration is complete: correct title/art,
 * live skip handlers, a scrubber. Both writers describe the SAME player state,
 * so their racing is invisible; each button press is delivered once. The
 * native bridge still provides the durable registration that survives
 * pause/background and wins the Bluetooth-reconnect resume. */
export function useMediaSessionSync(
  current: JellyfinItem | null,
  isPlaying: boolean,
  handlers: MediaSessionHandlers,
  position: number,
  duration: number,
) {
  useEffect(() => {
    setNowPlaying(current);
  }, [current]);
  useEffect(() => {
    setPlaybackState(isPlaying);
  }, [isPlaying]);
  useEffect(() => {
    bindMediaSessionHandlers(handlers);
  }, [handlers]);
  useEffect(() => {
    setPositionState(position, duration);
  }, [position, duration]);
}
