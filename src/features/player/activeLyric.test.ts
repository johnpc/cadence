import { describe, expect, it } from 'vitest';
import { activeLineIndex, isSynced } from './activeLyric';
import type { LyricLine } from '../../lib/jellyfinLyrics';

const plain: LyricLine[] = [{ text: 'a' }, { text: 'b' }, { text: 'c' }];
const synced: LyricLine[] = [
  { text: 'intro', start: undefined },
  { text: 'one', start: 2 },
  { text: 'two', start: 5 },
  { text: 'three', start: 9 },
];

describe('isSynced', () => {
  it('is false when no line carries timing', () => {
    expect(isSynced(plain)).toBe(false);
    expect(isSynced([])).toBe(false);
  });
  it('is true when any line has a start', () => {
    expect(isSynced(synced)).toBe(true);
  });
});

describe('activeLineIndex', () => {
  it('returns -1 before the first timed line', () => {
    expect(activeLineIndex(synced, 0)).toBe(-1);
    expect(activeLineIndex(synced, 1.9)).toBe(-1);
  });
  it('returns the last line whose start is <= position', () => {
    expect(activeLineIndex(synced, 2)).toBe(1);
    expect(activeLineIndex(synced, 4.9)).toBe(1);
    expect(activeLineIndex(synced, 5)).toBe(2);
    expect(activeLineIndex(synced, 100)).toBe(3);
  });
  it('is -1 for a plain (unsynced) list at any position', () => {
    expect(activeLineIndex(plain, 42)).toBe(-1);
  });
});
