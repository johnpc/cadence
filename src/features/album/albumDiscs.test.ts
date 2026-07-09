import { describe, expect, it } from 'vitest';
import { groupByDisc, isMultiDisc } from './albumDiscs';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const t = (id: string, disc?: number): JellyfinItem => ({
  Id: id,
  Name: id,
  Type: 'Audio',
  ParentIndexNumber: disc,
});

describe('groupByDisc', () => {
  it('keeps a single-disc album as one group with flat indices', () => {
    const discs = groupByDisc([t('a', 1), t('b', 1), t('c', 1)]);
    expect(discs).toHaveLength(1);
    expect(discs[0].disc).toBe(1);
    expect(discs[0].tracks.map((x) => x.index)).toEqual([0, 1, 2]);
    expect(isMultiDisc(discs)).toBe(false);
  });

  it('splits a multi-disc album, preserving flat album indices per track', () => {
    const discs = groupByDisc([t('a', 1), t('b', 1), t('c', 2), t('d', 2)]);
    expect(discs.map((d) => d.disc)).toEqual([1, 2]);
    expect(discs[0].tracks.map((x) => x.index)).toEqual([0, 1]);
    // Disc 2's tracks retain their position in the flat album queue, not 0/1.
    expect(discs[1].tracks.map((x) => x.index)).toEqual([2, 3]);
    expect(isMultiDisc(discs)).toBe(true);
  });

  it('treats tracks with no disc number as disc 1', () => {
    const discs = groupByDisc([t('a'), t('b')]);
    expect(discs).toHaveLength(1);
    expect(discs[0].disc).toBe(1);
  });

  it('handles an empty tracklist', () => {
    expect(groupByDisc([])).toEqual([]);
    expect(isMultiDisc([])).toBe(false);
  });
});
