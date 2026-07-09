import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** Repeat mode: off, repeat the whole queue, or repeat the current track. */
export type RepeatMode = 'off' | 'all' | 'one';

/** Player state + actions exposed via PlayerContext. */
export interface PlayerContextValue {
  /** The track currently loaded, or null when nothing is playing. */
  current: JellyfinItem | null;
  isPlaying: boolean;
  /** True while playback is stalled buffering (drives the loading spinner). */
  waiting: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  canNext: boolean;
  canPrev: boolean;
  /** The full queue and the current index (for the Up Next view). */
  queue: JellyfinItem[];
  queueIndex: number;
  /** Load a list of tracks and start playing at `startIndex`. */
  playQueue: (tracks: JellyfinItem[], startIndex?: number) => void;
  /** Play a list in shuffled order (turns shuffle on). */
  playShuffled: (tracks: JellyfinItem[]) => void;
  /** Queue a track to play right after the current one. */
  playNext: (track: JellyfinItem) => void;
  /** Append a track (or several) to the end of the queue. */
  addToQueue: (track: JellyfinItem | JellyfinItem[]) => void;
  /** Play/pause the current track. */
  toggle: () => void;
  next: () => void;
  prev: () => void;
  /** Jump to a specific index in the queue. */
  jumpTo: (index: number) => void;
  /** Remove the track at a given queue index. */
  removeFromQueue: (index: number) => void;
  /** Move a queued track from one index to another (keeps the playing track). */
  moveInQueue: (from: number, to: number) => void;
  /** Drop everything after the current track. */
  clearQueue: () => void;
  /** Seek to a position in seconds. */
  seek: (seconds: number) => void;
  toggleShuffle: () => void;
  /** Cycle repeat: off → all → one → off. */
  cycleRepeat: () => void;
  /** Minutes remaining on the sleep timer, or null when unset. */
  sleepMinutes: number | null;
  /** Arm the sleep timer for N minutes (null/0 cancels). */
  armSleep: (minutes: number | null) => void;
  /** Playback volume, 0–1. */
  volume: number;
  setVolume: (volume: number) => void;
}
