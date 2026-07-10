import { useMemo } from 'react';
import { useMediaSessionSync } from './useMediaSessionSync';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** Queue-derived transport (next/prev/shuffle/repeat) from usePlayerQueue. */
interface QueueControls {
  next: () => void;
  prev: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
}

/** Audio-element controls from usePlaybackControls + useVolume. */
interface AudioControls {
  toggle: () => void;
  seek: (seconds: number) => void;
  seekBy: (delta: number) => void;
  nudgeVolume: (delta: number) => void;
  toggleMute: () => void;
}

/** Wire OS-level integrations to the player: the W3C MediaSession (lock screen /
 * Bluetooth, incl. the scrubber via position/duration) and keyboard shortcuts.
 * Kept out of PlayerProvider for the line gate; both only act while a track is
 * loaded. */
export function usePlayerIntegrations(
  current: JellyfinItem | null,
  isPlaying: boolean,
  qc: QueueControls,
  ac: AudioControls,
  position: number,
  duration: number,
): void {
  const { toggle, seek, seekBy, nudgeVolume, toggleMute } = ac;
  const { next, prev, toggleShuffle, cycleRepeat } = qc;

  const media = useMemo(
    () => ({ play: toggle, pause: toggle, next, prev, seek }),
    [toggle, next, prev, seek],
  );
  useMediaSessionSync(current, isPlaying, media, position, duration);

  const keys = useMemo(
    () => ({ toggle, next, prev, seekBy, nudgeVolume, toggleMute, toggleShuffle, cycleRepeat }),
    [toggle, next, prev, seekBy, nudgeVolume, toggleMute, toggleShuffle, cycleRepeat],
  );
  useKeyboardShortcuts(keys, !!current);
}
