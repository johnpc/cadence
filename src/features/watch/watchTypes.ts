/**
 * The now-playing state the phone hands to the paired Apple Watch app, and the
 * commands the watch sends back. The watch is a REMOTE: the phone's web player
 * does the actual playback; the watch just displays state + sends transport
 * commands (via WatchConnectivity, relayed through the native MainViewController).
 * Kept to plain serializable fields — the watch process can't run any web code.
 */
export interface WatchState {
  /** Track title, or '' when nothing is playing. */
  title: string;
  /** Artist / subtitle line. */
  artist: string;
  /** Cover art URL (absolute, token-bearing) or null → watch shows a placeholder. */
  artUrl: string | null;
  /** Whether the phone is currently playing. */
  isPlaying: boolean;
  /** Current position + total duration in seconds (for the watch progress ring). */
  position: number;
  duration: number;
  /** True when there is a loaded track (watch shows controls vs an idle state). */
  hasTrack: boolean;
}

/** Commands the watch can send back to the phone player. */
export type WatchCommand = 'toggle' | 'next' | 'prev' | 'seekForward' | 'seekBack';

/** The DOM event names the native relay dispatches into the web player for each
 * watch command (mirrors cadence:audiointerruptionended). */
export const WATCH_COMMAND_EVENT: Record<WatchCommand, string> = {
  toggle: 'cadence:watch:toggle',
  next: 'cadence:watch:next',
  prev: 'cadence:watch:prev',
  seekForward: 'cadence:watch:seekforward',
  seekBack: 'cadence:watch:seekback',
};
