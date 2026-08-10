import { useNowPlayingSync } from './useNowPlayingSync';
import { useNowPlayingCommands } from './useNowPlayingCommands';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** The player pieces the native Now Playing bridge needs — a subset of what
 * PlayerProvider already assembles, so it wires in one call. */
interface NowPlayingDeps {
  current: JellyfinItem | null;
  isPlaying: boolean;
  position: number;
  duration: number;
  /** Current track's queue index + the queue length — published so iOS shows the
   * prev/next TRACK buttons (see NowPlayingState.queueIndex/queueCount). */
  queueIndex: number;
  queueCount: number;
  play: () => void;
  pause: () => void;
  next: () => void;
  prev: () => void;
  seek: (seconds: number) => void;
}

/**
 * Wire the native iOS Now Playing bridge: mirror now-playing state onto
 * MPNowPlayingInfoCenter and handle the transport commands MPRemoteCommandCenter
 * sends back. This is what keeps Cadence the durable OS Now Playing app so a
 * Bluetooth reconnect resumes THIS app's queue instead of Apple Podcasts/Music.
 * Bundles the sync + command halves so PlayerProvider wires it in one call; both
 * no-op off native iOS (no bridge / events never fire).
 */
export function useNativeNowPlaying(d: NowPlayingDeps): void {
  useNowPlayingSync(d.current, d.isPlaying, d.position, d.duration, d.queueIndex, d.queueCount);
  useNowPlayingCommands({
    play: d.play,
    pause: d.pause,
    next: d.next,
    prev: d.prev,
    seek: d.seek,
  });
}
