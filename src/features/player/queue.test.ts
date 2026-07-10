import { describe, expect, it } from 'vitest';
import {
  append,
  currentTrack,
  EMPTY_QUEUE,
  enqueueNext,
  hasNext,
  hasPrev,
  next,
  peekNextId,
  prev,
  removeAt,
  shuffleRest,
  unshuffle,
  startQueue,
  startShuffled,
} from './queue';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const track = (id: string): JellyfinItem => ({ Id: id, Name: `Song ${id}`, Type: 'Audio' });
const tracks = ['a', 'b', 'c'].map(track);

describe('queue', () => {
  it('empty queue has no current track', () => {
    expect(currentTrack(EMPTY_QUEUE)).toBeNull();
  });

  it('starts at a clamped index', () => {
    expect(startQueue(tracks, 1).index).toBe(1);
    expect(startQueue(tracks, 9).index).toBe(2);
    expect(startQueue(tracks, -3).index).toBe(0);
    expect(startQueue([], 5)).toEqual({ tracks: [], index: 0 });
  });

  it('walks forward and backward within bounds', () => {
    let q = startQueue(tracks, 0);
    expect(hasPrev(q)).toBe(false);
    expect(hasNext(q)).toBe(true);
    q = next(q);
    expect(currentTrack(q)?.Id).toBe('b');
    q = next(next(q)); // to 'c', then stays
    expect(currentTrack(q)?.Id).toBe('c');
    expect(hasNext(q)).toBe(false);
    q = prev(q);
    expect(currentTrack(q)?.Id).toBe('b');
  });

  it('prev at the start is a no-op', () => {
    const q = startQueue(tracks, 0);
    expect(prev(q)).toBe(q);
  });

  it('next wraps to the first track at the end when repeat-all (wrap=true)', () => {
    const q = startQueue(tracks, 2); // last
    expect(next(q).index).toBe(2); // no wrap → stays put
    expect(next(q, true).index).toBe(0); // wrap → first
  });

  it('prev wraps to the last track at the start when repeat-all (wrap=true)', () => {
    const q = startQueue(tracks, 0); // first
    expect(prev(q).index).toBe(0); // no wrap → stays put
    expect(prev(q, true).index).toBe(2); // wrap → last
  });

  it('peekNextId returns the upcoming id, respecting wrap and its absence', () => {
    expect(peekNextId(startQueue(tracks, 0))).toBe('b'); // mid-queue
    expect(peekNextId(startQueue(tracks, 2))).toBeNull(); // last, no wrap
    expect(peekNextId(startQueue(tracks, 2), true)).toBe('a'); // last, wrap → first
    expect(peekNextId(EMPTY_QUEUE)).toBeNull();
  });

  it('appends tracks', () => {
    const q = append(startQueue(tracks, 0), [track('d')]);
    expect(q.tracks.map((t) => t.Id)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('enqueues a track right after the current one', () => {
    const q = enqueueNext(startQueue(tracks, 0), track('x')); // current = 'a'
    expect(q.tracks.map((t) => t.Id)).toEqual(['a', 'x', 'b', 'c']);
    expect(q.index).toBe(0);
  });

  it('enqueueNext on an empty queue starts one', () => {
    const q = enqueueNext(EMPTY_QUEUE, track('x'));
    expect(q.tracks.map((t) => t.Id)).toEqual(['x']);
    expect(q.index).toBe(0);
  });

  it('removeAt before the current keeps it playing (index shifts down)', () => {
    const q = removeAt(startQueue(tracks, 2), 0); // current 'c' at 2 → now at 1
    expect(q.tracks.map((t) => t.Id)).toEqual(['b', 'c']);
    expect(q.index).toBe(1);
  });

  it('removeAt after the current leaves the index', () => {
    const q = removeAt(startQueue(tracks, 0), 2);
    expect(q.tracks.map((t) => t.Id)).toEqual(['a', 'b']);
    expect(q.index).toBe(0);
  });

  it('removeAt clamps the index and ignores out-of-range', () => {
    expect(removeAt(startQueue(tracks, 0), 9)).toEqual(startQueue(tracks, 0));
    const last = removeAt(startQueue(tracks, 2), 2); // remove current last
    expect(last.index).toBe(1);
  });

  it('shuffles the rest, keeping the current track first', () => {
    const q = startQueue(tracks, 1); // current = 'b'
    const shuffled = shuffleRest(q, () => 0); // deterministic
    expect(shuffled.index).toBe(0);
    expect(shuffled.tracks[0].Id).toBe('b');
    expect(shuffled.tracks.map((t) => t.Id).sort()).toEqual(['a', 'b', 'c']);
  });

  it('shuffle on an empty queue is a no-op', () => {
    expect(shuffleRest(EMPTY_QUEUE, () => 0)).toBe(EMPTY_QUEUE);
  });

  it('startShuffled reorders the whole list and starts at 0', () => {
    const q = startShuffled(tracks, () => 0);
    expect(q.index).toBe(0);
    expect(q.tracks.map((t) => t.Id).sort()).toEqual(['a', 'b', 'c']);
  });

  it('shuffleRest snapshots the pre-shuffle order for later restore', () => {
    const q = startQueue(tracks, 0);
    const shuffled = shuffleRest(q, () => 0);
    expect(shuffled.unshuffled?.map((t) => t.Id)).toEqual(['a', 'b', 'c']);
  });

  it('unshuffle restores the original order, keeping the current track selected', () => {
    // Shuffle from current 'c', then unshuffle — order returns to a,b,c and the
    // index points back at 'c'.
    const q = startQueue(tracks, 2); // current = 'c'
    const shuffled = shuffleRest(q, () => 0);
    const restored = unshuffle(shuffled);
    expect(restored.tracks.map((t) => t.Id)).toEqual(['a', 'b', 'c']);
    expect(restored.tracks[restored.index].Id).toBe('c');
    expect(restored.unshuffled).toBeUndefined();
  });

  it('unshuffle is a no-op without a snapshot', () => {
    const q = startQueue(tracks, 0);
    expect(unshuffle(q)).toBe(q);
  });
});
