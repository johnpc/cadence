import { afterEach, describe, expect, it } from 'vitest';
import { readIndex, addToIndex, removeFromIndex, indexedIds } from './downloadIndex';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const track = (Id: string, Name = Id): JellyfinItem => ({ Id, Name }) as JellyfinItem;

describe('downloadIndex', () => {
  afterEach(() => localStorage.clear());

  it('starts empty', () => {
    expect(readIndex()).toEqual([]);
  });

  it('adds newest-first and round-trips', () => {
    addToIndex(track('a'));
    addToIndex(track('b'));
    expect(readIndex().map((t) => t.Id)).toEqual(['b', 'a']);
  });

  it('re-adding the same id de-duplicates (moves to front)', () => {
    addToIndex(track('a'));
    addToIndex(track('b'));
    addToIndex(track('a'));
    expect(readIndex().map((t) => t.Id)).toEqual(['a', 'b']);
  });

  it('removes by id', () => {
    addToIndex(track('a'));
    addToIndex(track('b'));
    removeFromIndex('a');
    expect(readIndex().map((t) => t.Id)).toEqual(['b']);
  });

  it('indexedIds returns the id set', () => {
    addToIndex(track('a'));
    addToIndex(track('b'));
    expect(indexedIds()).toEqual(new Set(['a', 'b']));
  });

  it('tolerates corrupt storage (returns [])', () => {
    localStorage.setItem('cadence.downloads.index', '{not json');
    expect(readIndex()).toEqual([]);
  });

  it('tolerates a non-array JSON value', () => {
    localStorage.setItem('cadence.downloads.index', '{"a":1}');
    expect(readIndex()).toEqual([]);
  });
});
