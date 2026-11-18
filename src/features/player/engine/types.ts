/**
 * The playback engine's contract: its ONE state, its commands, and the platform
 * pieces it is given. Framework-free — React, MediaSession, the native bridges,
 * the Watch and play reporting are all subscribers of `PlayerEngine.state`.
 */
import type { Store } from '../../../lib/store';
import type { JellyfinItem } from '../../../lib/jellyfinTypes';
import type { QueueState } from '../queue';
import type { RepeatMode, SleepMode } from '../types';

/**
 * The transport, as one explicit state (it used to be `isPlaying` + `waiting` +
 * a play-intent module + a "has playback started" ref + a cast flag, which could
 * disagree — e.g. a spinner latched over a paused track).
 *
 * - `idle`      nothing loaded (empty queue).
 * - `paused`    a track is loaded and silent: restored at launch, paused, or
 *               finished at the end of the queue.
 * - `playing`   the element is producing audio.
 * - `buffering` meant to be playing but starved for data. Shows the spinner and
 *               arms the stall watchdog. Leaving it (play, pause, error) disarms.
 * - `casting`   a TV receiver owns playback and is playing; the local element
 *               stays silent.
 * - `casting-paused` the same, with the TV paused. (Two states rather than a
 *               "TV is playing" flag that only meant something while casting.)
 */
export type TransportStatus =
  'idle' | 'paused' | 'playing' | 'buffering' | 'casting' | 'casting-paused';

export interface PlayerState {
  queue: QueueState;
  shuffle: boolean;
  repeat: RepeatMode;
  status: TransportStatus;
  /** The user wants sound. Set when audio really starts, cleared only by a
   * deliberate pause/stop — so it survives an OS interruption (a call, Siri)
   * and tells the interruption-resume and stall paths what the user expects. */
  intent: boolean;
  /** Playback has really started at least once this session. Until then a
   * load error is the launch race (a restored track's URL built before the
   * session landed) and is recovered silently. */
  started: boolean;
  sleep: SleepMode;
  volume: number;
  rate: number;
}

/** Fast-ticking position/duration (seconds), in its own store so a tick never
 * re-renders anything that reads only `PlayerState`. */
export interface PlayerProgress {
  position: number;
  duration: number;
}

/** Everything the UI, the OS integrations and the tests can ask the player to do. */
export interface PlayerCommands {
  playQueue(tracks: JellyfinItem[], startIndex?: number): void;
  playShuffled(tracks: JellyfinItem[]): void;
  playNext(track: JellyfinItem): void;
  addToQueue(track: JellyfinItem | JellyfinItem[]): void;
  next(): void;
  /** Restart the current track when a few seconds in, else go back one. */
  prev(): void;
  jumpTo(index: number): void;
  removeFromQueue(index: number): void;
  moveInQueue(from: number, to: number): void;
  clearQueue(): void;
  /** End the session: silence + unload the element, end any cast, empty the queue. */
  stop(): void;
  /** Play/pause decided on what the UI shows (`isPlaying`), never `audio.paused`
   * — iOS can leave the element "not paused" after an interruption. */
  toggle(): void;
  /** Directional play/pause for the lock screen / Bluetooth / Watch. */
  play(): void;
  pause(): void;
  /** Re-assert playback after an OS interruption, without touching intent. */
  resume(): void;
  seek(seconds: number): void;
  seekBy(delta: number): void;
  toggleShuffle(): void;
  cycleRepeat(): void;
  armSleep(mode: SleepMode): void;
  setVolume(volume: number): void;
  nudgeVolume(delta: number): void;
  toggleMute(): void;
  setRate(rate: number): void;
}

export interface PlayerEngine extends PlayerCommands {
  readonly state: Store<PlayerState>;
  readonly progress: Store<PlayerProgress>;
  /** The live element position, read without subscribing to ticks. */
  position(): number;
  /** Bind the element + external stores and load the restored track (paused).
   * Returns the matching unbind. Safe to call again after unbinding (StrictMode). */
  start(): () => void;
}

/** The slice of HTMLAudioElement the engine uses — so tests can hand it a
 * plain object and run without a DOM. */
export interface AudioLike {
  src: string;
  currentTime: number;
  duration: number;
  paused: boolean;
  ended: boolean;
  volume: number;
  playbackRate: number;
  defaultPlaybackRate: number;
  readyState: number;
  error: { code: number } | null;
  play(): Promise<void>;
  pause(): void;
  load(): void;
  removeAttribute(name: string): void;
  addEventListener(type: string, listener: () => void): void;
  removeEventListener(type: string, listener: () => void): void;
}

export type LogFn = (category: string, message: string, fields?: Record<string, string>) => void;

/** The platform the engine runs on. `browserEngineDeps` wires the real one. */
export interface EngineDeps {
  audio: AudioLike;
  /** One-time platform setup when the engine starts (attach the element to the
   * DOM, adopt the iOS playback audio session). */
  attach(): void;
  initial: {
    queue: QueueState;
    shuffle: boolean;
    repeat: RepeatMode;
    volume: number;
    rate: number;
  };
  persist: {
    queue(queue: QueueState): void;
    modes(modes: { shuffle: boolean; repeat: RepeatMode }): void;
    volume(volume: number): void;
    rate(rate: number): void;
  };
  /** The src for a track: a local download's blob URL, else the stream URL.
   * Synchronous for the common (streaming) case so play() stays inside the
   * user gesture on iOS. */
  resolveSrc(id: string): string | Promise<string>;
  session: { userId(): string; subscribe(listener: () => void): () => void };
  cast: {
    connected(): boolean;
    playing(): boolean;
    subscribe(listener: () => void): () => void;
    load(track: JellyfinItem): Promise<void>;
    toggle(): Promise<void>;
    seek(seconds: number): Promise<void>;
    stop(): Promise<void>;
  };
  /** Where an audiobook should resume (seconds), or null for music / no save. */
  resumeAt(track: JellyfinItem, durationSeconds: number): Promise<number | null>;
  notify(message: string): void;
  haptic(): void;
  /** Audio really started — the native layer re-asserts its audio session. */
  onAudible(): void;
  random(): number;
  log: LogFn;
  /** How long a buffering stall may last before recovery (ms). */
  stallTimeoutMs: number;
  /** Whether the server can't be reached (or offline mode is on), and which
   * tracks are on the device — so a failure offline skips to what CAN play. */
  availability: {
    offline(): boolean;
    downloaded(id: string): boolean;
    /** Ask the server whether it's there (true = reachable). */
    probe(): Promise<boolean>;
  };
}
