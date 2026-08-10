/**
 * The now-playing state the web player hands to the native iOS layer, and the
 * transport commands native sends back.
 *
 * Why this exists: the WKWebView's W3C MediaSession only holds the OS "Now
 * Playing" slot WHILE its <audio> is actively playing — when paused, backgrounded,
 * or the Bluetooth route drops, WebKit tears that registration down. So on a
 * Bluetooth RECONNECT iOS resumes whichever app kept a DURABLE registration
 * (Apple Podcasts/Music, which register natively via MPNowPlayingInfoCenter) —
 * not Cadence. Registering natively (MPNowPlayingInfoCenter + MPRemoteCommandCenter,
 * see NowPlayingBridge.swift) keeps Cadence the durable Now Playing app so a BT
 * reconnect resumes THIS app's queue.
 *
 * The web player stays the source of truth (it does the actual playback); native
 * mirrors its STATE and relays transport COMMANDS back as DOM events — the same
 * one-way bridge the Apple Watch remote uses. Plain serializable fields only.
 */
export interface NowPlayingState {
  /** Track title, or '' when nothing is loaded. */
  title: string;
  /** Artist / subtitle line. */
  artist: string;
  /** Album name (shown on the lock screen), or ''. */
  album: string;
  /** Cover-art URL (absolute, token-bearing) native fetches for the lock screen,
   * or null → no artwork. */
  artUrl: string | null;
  /** Whether the web player is currently playing (drives the play/pause glyph +
   * the native playback rate 1/0). */
  isPlaying: boolean;
  /** Current position + total duration in seconds (the lock-screen scrubber). */
  position: number;
  duration: number;
  /** True when a track is loaded — native clears Now Playing when false. */
  hasTrack: boolean;
  /** The current track's 0-based index in the queue and the queue's total length.
   * Native publishes these as MPNowPlayingInfoPropertyPlaybackQueueIndex/Count so
   * iOS/CarPlay/Bluetooth shows the prev/next TRACK buttons — without a queue count
   * some heads gray them out (the "lost next/prev" symptom). */
  queueIndex: number;
  queueCount: number;
}

/** Transport commands native (MPRemoteCommandCenter) can send back to the player. */
export type NowPlayingCommand = 'play' | 'pause' | 'next' | 'prev';

/** The DOM events the native relay dispatches into the web player for each remote
 * command (mirrors cadence:watch:* / cadence:audiointerruptionended). */
export const NOW_PLAYING_EVENT: Record<NowPlayingCommand, string> = {
  play: 'cadence:nowplaying:play',
  pause: 'cadence:nowplaying:pause',
  next: 'cadence:nowplaying:next',
  prev: 'cadence:nowplaying:prev',
};

/** Absolute-seek event (lock-screen scrubber); carries the target seconds in
 * `detail`. Separate from the commands above because it needs a payload. */
export const NOW_PLAYING_SEEK_EVENT = 'cadence:nowplaying:seek';
