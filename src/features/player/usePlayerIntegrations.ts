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
  play: () => void;
  pause: () => void;
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
  const { toggle, play, pause, seek, seekBy, nudgeVolume, toggleMute } = ac;
  const { next, prev, toggleShuffle, cycleRepeat } = qc;

  // Bind the OS transport to DIRECTIONAL play/pause (not a single toggle): the
  // lock screen sends an explicit command, and routing both through toggle let an
  // iOS post-interruption state desync run the wrong branch — so its "play" button
  // appeared dead until a manual pause resynced. Distinct handlers can't misfire.
  const media = useMemo(() => ({ play, pause, next, prev, seek }), [play, pause, next, prev, seek]);
  useMediaSessionSync(current, isPlaying, media, position, duration);

  const keys = useMemo(
    () => ({ toggle, next, prev, seekBy, nudgeVolume, toggleMute, toggleShuffle, cycleRepeat }),
    [toggle, next, prev, seekBy, nudgeVolume, toggleMute, toggleShuffle, cycleRepeat],
  );
  useKeyboardShortcuts(keys, !!current);
}
