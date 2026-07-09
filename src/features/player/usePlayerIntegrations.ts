import { useMemo } from 'react';
import { useMediaSessionSync } from './useMediaSessionSync';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

interface Controls {
  toggle: () => void;
  next: () => void;
  prev: () => void;
  nudgeVolume: (delta: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
}

/** Wire OS-level integrations to the player: the W3C MediaSession (lock screen /
 * Bluetooth) and keyboard shortcuts. Kept out of PlayerProvider for the line
 * gate; both only act while a track is loaded. */
export function usePlayerIntegrations(
  current: JellyfinItem | null,
  isPlaying: boolean,
  c: Controls,
): void {
  const media = useMemo(
    () => ({ play: c.toggle, pause: c.toggle, next: c.next, prev: c.prev }),
    [c.toggle, c.next, c.prev],
  );
  useMediaSessionSync(current, isPlaying, media);

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
