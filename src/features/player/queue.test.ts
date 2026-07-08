import { describe, expect, it } from 'vitest';
import {
  append,
  currentTrack,
  EMPTY_QUEUE,
  hasNext,
  hasPrev,
  next,
  prev,
  shuffleRest,
  startQueue,
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

  it('appends tracks', () => {
    const q = append(startQueue(tracks, 0), [track('d')]);
    expect(q.tracks.map((t) => t.Id)).toEqual(['a', 'b', 'c', 'd']);
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
});
