import { describe, expect, it } from 'vitest';
import {
  activeClipIndex,
  clipAt,
  clipForFragment,
  partOffsets,
  toGlobalSeconds,
  toPartPosition,
} from './timeline';
import type { ReadAlongClip, ReadAlongPart } from './storytellerApi';

const parts: ReadAlongPart[] = [
  { ItemId: 'p1', Duration: 100 },
  { ItemId: 'p2', Duration: 50 },
  { ItemId: 'p3', Duration: 25 },
];

const clips: ReadAlongClip[] = [
  { Start: 0, End: 4, Chapter: 0, Fragment: 's1' },
  { Start: 4, End: 8, Chapter: 0, Fragment: 's2' },
  { Start: 8, End: 12, Chapter: 1, Fragment: 's3' },
  { Start: 120, End: 124, Chapter: 1, Fragment: 's4' },
];

describe('partOffsets', () => {
  it('accumulates durations in play order', () => {
    expect(partOffsets(parts)).toEqual([0, 100, 150]);
  });
  it('is empty for no parts', () => {
    expect(partOffsets([])).toEqual([]);
  });
});

describe('toGlobalSeconds', () => {
  it('adds the part offset', () => {
    expect(toGlobalSeconds(parts, 'p2', 10)).toBe(110);
    expect(toGlobalSeconds(parts, 'p1', 10)).toBe(10);
  });
  it('is null for an item that is not a part', () => {
    expect(toGlobalSeconds(parts, 'nope', 10)).toBeNull();
  });
});

describe('toPartPosition', () => {
  it('finds the part containing the global time', () => {
    expect(toPartPosition(parts, 0)).toEqual({ itemId: 'p1', seconds: 0 });
    expect(toPartPosition(parts, 99.9)).toEqual({ itemId: 'p1', seconds: 99.9 });
    expect(toPartPosition(parts, 100)).toEqual({ itemId: 'p2', seconds: 0 });
    expect(toPartPosition(parts, 160)).toEqual({ itemId: 'p3', seconds: 10 });
  });
  it('clamps past the end into the last part and before the start to 0', () => {
    expect(toPartPosition(parts, 500)).toEqual({ itemId: 'p3', seconds: 350 });
    expect(toPartPosition(parts, -5)).toEqual({ itemId: 'p1', seconds: 0 });
  });
  it('is null with no parts', () => {
    expect(toPartPosition([], 10)).toBeNull();
  });
});

describe('clipAt', () => {
  it('returns the last clip starting at or before the time', () => {
    expect(clipAt(clips, 0)).toBe(0);
    expect(clipAt(clips, 3.9)).toBe(0);
    expect(clipAt(clips, 4)).toBe(1);
    expect(clipAt(clips, 50)).toBe(2); // in a gap: the preceding clip stays active
    expect(clipAt(clips, 999)).toBe(3);
  });
  it('is -1 before the first clip or with no clips', () => {
    expect(clipAt([{ ...clips[0], Start: 2 }], 1)).toBe(-1);
    expect(clipAt([], 1)).toBe(-1);
  });
});

describe('clipForFragment', () => {
  it('matches on chapter AND fragment', () => {
    expect(clipForFragment(clips, 1, 's3')?.Start).toBe(8);
    expect(clipForFragment(clips, 0, 's3')).toBeNull();
    expect(clipForFragment(clips, 1, 'zzz')).toBeNull();
  });
});

describe('activeClipIndex', () => {
  it('lifts a part position onto the global clock before looking up the clip', () => {
    // 20 s into part 2 = global 120 → the clip starting at 120.
    expect(activeClipIndex(clips, parts, 'p2', 20)).toBe(3);
    expect(activeClipIndex(clips, parts, 'p1', 5)).toBe(1);
  });
  it('is -1 when the current track is not a part of the book', () => {
    expect(activeClipIndex(clips, parts, 'song', 5)).toBe(-1);
  });
});
