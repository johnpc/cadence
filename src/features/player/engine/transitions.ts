/**
 * The engine's decisions, as pure functions of its state — every branch of the
 * player's behaviour lives here and is tested without an element, a DOM or a
 * timer. The engine only performs the effect each decision names.
 */
import { hasNext, type QueueState } from '../queue';
import type { PlayerState, TransportStatus } from './types';
import type { RepeatMode } from '../types';

/** What the UI shows as "playing": local audio running (even while buffering),
 * or the TV playing during a cast. */
export function isPlayingState(s: Pick<PlayerState, 'status'>): boolean {
  return s.status === 'playing' || s.status === 'buffering' || s.status === 'casting';
}

/** A TV receiver owns the transport (playing or paused). */
export function isCasting(status: TransportStatus): boolean {
  return status === 'casting' || status === 'casting-paused';
}

/** Next/skip has somewhere to go: a later track, or a wrap under repeat-all. */
export function canAdvance(queue: QueueState, repeat: RepeatMode): boolean {
  return hasNext(queue) || (repeat === 'all' && queue.tracks.length > 1);
}

/** The element events that move the transport. `resumed` = `playing` or `canplay`. */
export type ElementEvent = 'play' | 'pause' | 'waiting' | 'resumed';

/** The transport after an element event. A cast owns the transport until it ends,
 * so element events never move it out of `casting`. */
export function nextStatus(
  current: TransportStatus,
  event: ElementEvent,
  element: { paused: boolean; hasTrack: boolean },
): TransportStatus {
  if (isCasting(current)) return current;
  if (event === 'play') return 'playing';
  if (event === 'pause') return element.hasTrack ? 'paused' : 'idle';
  if (event === 'waiting') return element.paused ? current : 'buffering';
  if (current !== 'buffering') return current;
  return element.paused ? 'paused' : 'playing';
}

/** The queue index of the next track `playable` accepts after the current one
 * (wrapping only under repeat-all), or null when none ahead can play. */
export function nextPlayableIndex(
  queue: QueueState,
  wrap: boolean,
  playable: (id: string) => boolean,
): number | null {
  const n = queue.tracks.length;
  const steps = wrap ? n - 1 : n - 1 - queue.index;
  for (let step = 1; step <= steps; step++) {
    const at = (queue.index + step) % n;
    if (playable(queue.tracks[at].Id)) return at;
  }
  return null;
}

/** What a natural end of track does. */
export type EndedAction = 'sleep' | 'replay' | 'end' | 'advance';

export function endedAction(s: Pick<PlayerState, 'sleep' | 'repeat' | 'queue'>): EndedAction {
  // "Stop after this track": a natural end pauses and disarms instead of advancing.
  if (s.sleep === 'track') return 'sleep';
  if (s.repeat === 'one') return 'replay';
  // Nothing follows (repeat off, no next — Autoplay radio would have appended by
  // now): say so rather than leave playback looking frozen.
  if (s.repeat === 'off' && !hasNext(s.queue)) return 'end';
  return 'advance';
}

/** What a load error (or a stall that outlived the watchdog) does. */
export type ErrorAction = 'silent' | 'retry' | 'skip' | 'give-up';

export function errorAction(input: {
  /** Has playback really started this session? */
  started: boolean;
  /** Reloads already spent on this track. */
  attempts: number;
  /** Is there somewhere to skip to? */
  canSkip: boolean;
  maxRetries?: number;
}): ErrorAction {
  // A restored track erroring before the user pressed play is the launch race
  // (its URL was built before the session landed) — the session-ready load
  // fixes it. No toast, no skip.
  if (!input.started) return 'silent';
  // Reload the same track first: the usual cause is transient, and the user
  // keeps their place (the position rides a pending seek across the reload).
  if (input.attempts < (input.maxRetries ?? 1)) return 'retry';
  return input.canSkip ? 'skip' : 'give-up';
}
