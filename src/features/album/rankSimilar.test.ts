import { describe, expect, it } from 'vitest';
import { rankSimilarAlbumIds, SIMILAR_LIMIT } from './rankSimilar';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const track = (albumId?: string): JellyfinItem => ({
  Id: `t-${albumId ?? 'none'}`,
  Name: 'Track',
  Type: 'Audio',
  AlbumId: albumId,
});

describe('rankSimilarAlbumIds', () => {
  it('ranks albums by how often their tracks appear', () => {
    const mix = [track('a'), track('b'), track('b'), track('b'), track('a')];
    expect(rankSimilarAlbumIds(mix, 'seed')).toEqual(['b', 'a']);
  });

  it('excludes the seed album and tracks with no album', () => {
    const mix = [track('seed'), track('seed'), track(undefined), track('a')];
    expect(rankSimilarAlbumIds(mix, 'seed')).toEqual(['a']);
  });

  it('caps the result at the limit', () => {
    const mix = Array.from({ length: 20 }, (_, i) => track(`al${i}`));
    expect(rankSimilarAlbumIds(mix, 'seed')).toHaveLength(SIMILAR_LIMIT);
  });

  it('respects an explicit limit', () => {
    const mix = [track('a'), track('b'), track('c')];
    expect(rankSimilarAlbumIds(mix, 'seed', 2)).toHaveLength(2);
  });

  it('returns nothing for an empty mix', () => {
    expect(rankSimilarAlbumIds([], 'seed')).toEqual([]);
  });
});
