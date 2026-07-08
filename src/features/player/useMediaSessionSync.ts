import { useEffect } from 'react';
import {
  bindMediaSessionHandlers,
  setNowPlaying,
  setPlaybackState,
  type MediaSessionHandlers,
} from './mediaSession';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** Keep the OS now-playing UI in sync with the player, and bind its controls. */
export function useMediaSessionSync(
  current: JellyfinItem | null,
  isPlaying: boolean,
  handlers: MediaSessionHandlers,
) {
  useEffect(() => setNowPlaying(current), [current]);
  useEffect(() => setPlaybackState(isPlaying), [isPlaying]);
  useEffect(() => bindMediaSessionHandlers(handlers), [handlers]);
}
