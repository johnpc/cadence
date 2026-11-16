import type { AudioLike } from '../features/player/engine/types';

/**
 * A controllable stand-in for HTMLAudioElement — no DOM, no decoding. It
 * behaves like the real element where the engine depends on it: play() fires
 * `play`, pause() fires `pause`, a new src resets readyState, and tests drive
 * everything else (`waiting`, `ended`, `error`, metadata) with `fire`.
 */
export class FakeAudio implements AudioLike {
  src = '';
  currentTime = 0;
  duration = Number.NaN;
  paused = true;
  ended = false;
  volume = 1;
  playbackRate = 1;
  defaultPlaybackRate = 1;
  readyState = 0;
  error: { code: number } | null = null;
  preload = '';
  muted = false;
  parentNode: unknown = null;
  /** play() rejects with this (once) when set — e.g. a NotAllowedError. */
  rejectNextPlay: Error | null = null;
  loads = 0;
  private handlers = new Map<string, Set<() => void>>();

  play(): Promise<void> {
    if (this.rejectNextPlay) {
      const err = this.rejectNextPlay;
      this.rejectNextPlay = null;
      return Promise.reject(err);
    }
    this.paused = false;
    this.fire('play');
    return Promise.resolve();
  }
  pause(): void {
    if (this.paused) return;
    this.paused = true;
    this.fire('pause');
  }
  load(): void {
    this.loads++;
    this.readyState = 0;
  }
  removeAttribute(name: string): void {
    if (name === 'src') this.src = '';
  }
  setAttribute(): void {}
  addEventListener(type: string, listener: () => void): void {
    if (!this.handlers.has(type)) this.handlers.set(type, new Set());
    this.handlers.get(type)?.add(listener);
  }
  removeEventListener(type: string, listener: () => void): void {
    this.handlers.get(type)?.delete(listener);
  }
  listenerCount(type: string): number {
    return this.handlers.get(type)?.size ?? 0;
  }
  fire(type: string): void {
    for (const fn of [...(this.handlers.get(type) ?? [])]) fn();
  }
  /** Metadata arrived for the current src. */
  loadMetadata(duration: number): void {
    this.duration = duration;
    this.readyState = 1;
    this.fire('loadedmetadata');
  }
  /** Playback advanced to `seconds`. */
  tick(seconds: number): void {
    this.currentTime = seconds;
    this.fire('timeupdate');
  }
  /** The track played to its natural end. */
  finish(): void {
    this.ended = true;
    this.paused = true;
    this.fire('pause');
    this.fire('ended');
    this.ended = false;
  }
}
