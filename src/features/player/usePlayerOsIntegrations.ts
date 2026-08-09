import { usePlayerIntegrations } from './usePlayerIntegrations';
import { useWatchRemote } from '../watch/useWatchRemote';
import { useNativeNowPlaying } from '../nowplaying/useNativeNowPlaying';
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
 * state: the W3C MediaSession (lock screen / Bluetooth in the PWA), the NATIVE
 * iOS Now Playing bridge (MPNowPlayingInfoCenter + MPRemoteCommandCenter — the
 * durable registration that wins the Bluetooth-reconnect resume in the app), and
 * the Apple Watch remote. All take current + isPlaying + position/duration + the
 * transport controls, so bundling them here keeps PlayerProvider lean. All no-op
 * when their platform surface is absent.
 *
 * On the native app the WKWebView's own MediaSession STANDS DOWN (see
 * useMediaSessionSync) so native is the sole owner of the OS now-playing surface
 * — otherwise both would answer the same lock-screen button. The PWA has no
 * native bridge, so it keeps using MediaSession as before.
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
  useNativeNowPlaying({
    current,
    isPlaying,
    position,
    duration,
    play: ac.play,
    pause: ac.pause,
    next: qc.next,
    prev: qc.prev,
    seek: ac.seek,
  });
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
