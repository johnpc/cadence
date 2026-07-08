import { describe, expect, it } from 'vitest';
import { rankRelatedArtistIds, RELATED_LIMIT } from './rankRelated';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const track = (...artists: [string, string][]): JellyfinItem => ({
  Id: `t-${artists.map((a) => a[0]).join('')}`,
  Name: 'track',
  Type: 'Audio',
  ArtistItems: artists.map(([Id, Name]) => ({ Id, Name })),
});

describe('rankRelatedArtistIds', () => {
  it('ranks co-occurring artists by frequency, excluding the seed', () => {
    const mix = [
      track(['seed', 'Seed'], ['a', 'A']),
      track(['seed', 'Seed'], ['a', 'A']),
      track(['b', 'B']),
    ];
    expect(rankRelatedArtistIds(mix, 'seed')).toEqual(['a', 'b']);
  });

  it('caps the result at the limit', () => {
    const mix = Array.from({ length: 20 }, (_, i) => track([`a${i}`, `A${i}`]));
    expect(rankRelatedArtistIds(mix, 'seed')).toHaveLength(RELATED_LIMIT);
  });

  it('returns an empty list when only the seed appears', () => {
    expect(rankRelatedArtistIds([track(['seed', 'Seed'])], 'seed')).toEqual([]);
  });

  it('ignores artist entries without an id', () => {
    const mix: JellyfinItem[] = [
      { Id: 't', Name: 'x', Type: 'Audio', ArtistItems: [{ Id: '', Name: 'No id' }] },
    ];
    expect(rankRelatedArtistIds(mix, 'seed')).toEqual([]);
  });
});
