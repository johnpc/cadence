import { describe, expect, it } from 'vitest';
import { moveAt, clearUpcoming } from './queueMove';
import type { QueueState } from './queue';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const t = (id: string): JellyfinItem => ({ Id: id, Name: id, Type: 'Audio' });
const q = (ids: string[], index: number): QueueState => ({ tracks: ids.map(t), index });

describe('moveAt', () => {
  it('moves a later track up and keeps the playing track selected', () => {
    const r = moveAt(q(['a', 'b', 'c'], 0), 2, 0);
    expect(r.tracks.map((x) => x.Id)).toEqual(['c', 'a', 'b']);
    expect(r.index).toBe(1); // 'a' was playing, now at index 1
  });

  it('moves the playing track itself and follows it', () => {
    const r = moveAt(q(['a', 'b', 'c'], 1), 1, 2);
    expect(r.tracks.map((x) => x.Id)).toEqual(['a', 'c', 'b']);
    expect(r.index).toBe(2);
  });

  it('clamps an out-of-range destination', () => {
    const r = moveAt(q(['a', 'b'], 0), 0, 9);
    expect(r.tracks.map((x) => x.Id)).toEqual(['b', 'a']);
    expect(r.index).toBe(1);
  });

  it('is a no-op for an out-of-range source or a same-slot move', () => {
    const start = q(['a', 'b'], 0);
    expect(moveAt(start, 5, 0)).toBe(start);
    expect(moveAt(start, 1, 1)).toBe(start);
  });
});

describe('clearUpcoming', () => {
  it('drops everything after the current track', () => {
    const r = clearUpcoming(q(['a', 'b', 'c'], 0));
    expect(r.tracks.map((x) => x.Id)).toEqual(['a']);
    expect(r.index).toBe(0);
  });

  it('keeps tracks before and including the current one', () => {
    const r = clearUpcoming(q(['a', 'b', 'c'], 1));
    expect(r.tracks.map((x) => x.Id)).toEqual(['a', 'b']);
    expect(r.index).toBe(1);
  });

  it('is a no-op when already at the last track', () => {
    const start = q(['a', 'b'], 1);
    expect(clearUpcoming(start)).toBe(start);
  });
});
