import { usePlayerIntegrations } from './usePlayerIntegrations';
import { useWatchRemote } from '../watch/useWatchRemote';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

interface QueueControls {
  next: () => void;
  prev: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
}
interface AudioControls {
  toggle: () => void;
  play: () => void;
  pause: () => void;
  seek: (seconds: number) => void;
  seekBy: (delta: number) => void;
  nudgeVolume: (delta: number) => void;
  toggleMute: () => void;
}

/**
 * Wire every OS-level integration that mirrors/receives the SAME now-playing
 * state: the W3C MediaSession (lock screen / Bluetooth) and the Apple Watch
 * remote. Both take current + isPlaying + position/duration + the transport
 * controls, so bundling them here keeps PlayerProvider lean. All no-op when their
 * platform surface is absent.
 */
export function usePlayerOsIntegrations(
  current: JellyfinItem | null,
  isPlaying: boolean,
  qc: QueueControls,
  ac: AudioControls,
  position: number,
  duration: number,
): void {
  usePlayerIntegrations(current, isPlaying, qc, ac, position, duration);
  useWatchRemote({
    current,
    isPlaying,
    position,
    duration,
    toggle: ac.toggle,
    seekBy: ac.seekBy,
    next: qc.next,
    prev: qc.prev,
  });
}
