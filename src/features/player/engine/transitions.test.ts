// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { canAdvance, endedAction, errorAction, isPlayingState, nextStatus } from './transitions';
import { startQueue } from '../queue';
import { track } from '../../../test/engineHarness';

const two = startQueue([track('a'), track('b')], 0);
const lastOfTwo = startQueue([track('a'), track('b')], 1);
const one = startQueue([track('a')], 0);

describe('isPlayingState', () => {
  it('is true while local audio runs (even buffering) or the TV plays', () => {
    expect(isPlayingState({ status: 'playing', castPlaying: false })).toBe(true);
    expect(isPlayingState({ status: 'buffering', castPlaying: false })).toBe(true);
    expect(isPlayingState({ status: 'casting', castPlaying: true })).toBe(true);
    expect(isPlayingState({ status: 'casting', castPlaying: false })).toBe(false);
    expect(isPlayingState({ status: 'paused', castPlaying: true })).toBe(false);
    expect(isPlayingState({ status: 'idle', castPlaying: false })).toBe(false);
  });
});

describe('canAdvance', () => {
  it('needs a later track, or a wrap under repeat-all with more than one track', () => {
    expect(canAdvance(two, 'off')).toBe(true);
    expect(canAdvance(lastOfTwo, 'off')).toBe(false);
    expect(canAdvance(lastOfTwo, 'all')).toBe(true);
    expect(canAdvance(one, 'all')).toBe(false);
  });
});

describe('nextStatus', () => {
  const el = (paused: boolean, hasTrack = true) => ({ paused, hasTrack });
  it('play → playing; pause → paused (idle without a track)', () => {
    expect(nextStatus('paused', 'play', el(false))).toBe('playing');
    expect(nextStatus('playing', 'pause', el(true))).toBe('paused');
    expect(nextStatus('playing', 'pause', el(true, false))).toBe('idle');
  });
  it('waiting buffers only an element that is trying to play', () => {
    expect(nextStatus('playing', 'waiting', el(false))).toBe('buffering');
    expect(nextStatus('paused', 'waiting', el(true))).toBe('paused');
  });
  it('resumed ends buffering — to paused if the element stopped meanwhile', () => {
    expect(nextStatus('buffering', 'resumed', el(false))).toBe('playing');
    expect(nextStatus('buffering', 'resumed', el(true))).toBe('paused');
    expect(nextStatus('paused', 'resumed', el(true))).toBe('paused');
    expect(nextStatus('playing', 'resumed', el(false))).toBe('playing');
  });
  it('a cast owns the transport: element events never leave casting', () => {
    for (const ev of ['play', 'pause', 'waiting', 'resumed'] as const) {
      expect(nextStatus('casting', ev, el(true))).toBe('casting');
    }
  });
});

describe('endedAction', () => {
  it('sleep-at-track-end beats everything', () => {
    expect(endedAction({ sleep: 'track', repeat: 'one', queue: two })).toBe('sleep');
  });
  it('repeat-one replays; the end of a non-repeating queue ends; otherwise advance', () => {
    expect(endedAction({ sleep: null, repeat: 'one', queue: lastOfTwo })).toBe('replay');
    expect(endedAction({ sleep: null, repeat: 'off', queue: lastOfTwo })).toBe('end');
    expect(endedAction({ sleep: 5, repeat: 'off', queue: two })).toBe('advance');
    expect(endedAction({ sleep: null, repeat: 'all', queue: lastOfTwo })).toBe('advance');
  });
});

describe('errorAction', () => {
  it('is silent before playback ever started (the launch race)', () => {
    expect(errorAction({ started: false, attempts: 0, canSkip: true })).toBe('silent');
  });
  it('retries once, then skips — or gives up with nowhere to go', () => {
    expect(errorAction({ started: true, attempts: 0, canSkip: true })).toBe('retry');
    expect(errorAction({ started: true, attempts: 1, canSkip: true })).toBe('skip');
    expect(errorAction({ started: true, attempts: 1, canSkip: false })).toBe('give-up');
    expect(errorAction({ started: true, attempts: 1, canSkip: true, maxRetries: 2 })).toBe('retry');
  });
});
