import { currentTrack } from '../queue';
import { isPlayingState } from '../engine/transitions';
import type { JellyfinItem } from '../../../lib/jellyfinTypes';
import type { PlayerProgress, PlayerState } from '../engine/types';

/** What every "now playing" surface shows (MediaSession, iOS Now Playing, the
 * Watch): one derivation, so they can never describe different states. */
export interface NowPlayingSnapshot {
  track: JellyfinItem | null;
  isPlaying: boolean;
  /** Whole seconds — the bridges interpolate between pushes. */
  position: number;
  duration: number;
  queueIndex: number;
  queueCount: number;
}

export function nowPlayingSnapshot(s: PlayerState, p: PlayerProgress): NowPlayingSnapshot {
  return {
    track: currentTrack(s.queue),
    isPlaying: isPlayingState(s),
    position: Math.round(p.position),
    duration: Math.round(p.duration),
    queueIndex: s.queue.index,
    queueCount: s.queue.tracks.length,
  };
}

/** Subscribe to both stores and call `push` with a fresh snapshot whenever
 * either changes (callers dedupe what they send). Fires once immediately. */
export function onNowPlaying(
  engine: {
    state: { get(): PlayerState; subscribe(l: () => void): () => void };
    progress: { get(): PlayerProgress; subscribe(l: () => void): () => void };
  },
  push: (snap: NowPlayingSnapshot) => void,
): () => void {
  const emit = () => push(nowPlayingSnapshot(engine.state.get(), engine.progress.get()));
  emit();
  const offState = engine.state.subscribe(emit);
  const offProgress = engine.progress.subscribe(emit);
  return () => {
    offState();
    offProgress();
  };
}
