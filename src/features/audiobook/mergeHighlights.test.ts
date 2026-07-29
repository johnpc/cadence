import { describe, expect, it } from 'vitest';
import { mergeHighlights } from './mergeHighlights';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const b = (id: string): JellyfinItem => ({ Id: id, Name: id, Type: 'AudioBook' }) as JellyfinItem;

describe('mergeHighlights', () => {
  it('puts resumable first, then favorites', () => {
    expect(mergeHighlights([b('a')], [b('c')]).map((x) => x.Id)).toEqual(['a', 'c']);
  });

  it('dedupes a book that is both resumable and favorite', () => {
    expect(mergeHighlights([b('a'), b('b')], [b('b'), b('c')]).map((x) => x.Id)).toEqual([
      'a',
      'b',
      'c',
    ]);
  });

  it('handles empty inputs', () => {
    expect(mergeHighlights([], [])).toEqual([]);
    expect(mergeHighlights([], [b('x')]).map((x) => x.Id)).toEqual(['x']);
  });
});
