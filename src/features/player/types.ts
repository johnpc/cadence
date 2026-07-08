import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** Player state + actions exposed via PlayerContext. */
export interface PlayerContextValue {
  /** The track currently loaded, or null when nothing is playing. */
  current: JellyfinItem | null;
  isPlaying: boolean;
  /** Playback position + duration in seconds (0 until known). */
  position: number;
  duration: number;
  shuffle: boolean;
  canNext: boolean;
  canPrev: boolean;
  /** Load a list of tracks and start playing at `startIndex`. */
  playQueue: (tracks: JellyfinItem[], startIndex?: number) => void;
  /** Play/pause the current track. */
  toggle: () => void;
  next: () => void;
  prev: () => void;
  /** Seek to a position in seconds. */
  seek: (seconds: number) => void;
  toggleShuffle: () => void;
}
