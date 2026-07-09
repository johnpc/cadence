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
 * re-render happens here. */
export function useMediaSessionSync(
  current: JellyfinItem | null,
  isPlaying: boolean,
  handlers: MediaSessionHandlers,
  position: number,
  duration: number,
) {
  useEffect(() => setNowPlaying(current), [current]);
  useEffect(() => setPlaybackState(isPlaying), [isPlaying]);
  useEffect(() => bindMediaSessionHandlers(handlers), [handlers]);
  useEffect(() => setPositionState(position, duration), [position, duration]);
}
