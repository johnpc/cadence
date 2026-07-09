import { useMemo } from 'react';
import { useMediaSessionSync } from './useMediaSessionSync';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

interface Controls {
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (seconds: number) => void;
  nudgeVolume: (delta: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
}

/** Wire OS-level integrations to the player: the W3C MediaSession (lock screen /
 * Bluetooth, incl. the scrubber via position/duration) and keyboard shortcuts.
 * Kept out of PlayerProvider for the line gate; both only act while a track is
 * loaded. */
export function usePlayerIntegrations(
  current: JellyfinItem | null,
  isPlaying: boolean,
  c: Controls,
  position: number,
  duration: number,
): void {
  const media = useMemo(
    () => ({ play: c.toggle, pause: c.toggle, next: c.next, prev: c.prev, seek: c.seek }),
    [c.toggle, c.next, c.prev, c.seek],
  );
  useMediaSessionSync(current, isPlaying, media, position, duration);

  const keys = useMemo(
    () => ({
      toggle: c.toggle,
      next: c.next,
      prev: c.prev,
      nudgeVolume: c.nudgeVolume,
      toggleMute: c.toggleMute,
      toggleShuffle: c.toggleShuffle,
      cycleRepeat: c.cycleRepeat,
    }),
    [c.toggle, c.next, c.prev, c.nudgeVolume, c.toggleMute, c.toggleShuffle, c.cycleRepeat],
  );
  useKeyboardShortcuts(keys, !!current);
}
