import { describe, expect, it } from 'vitest';
import { buildDailyMixes, MIX_COUNT } from './dailyMix';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const artist = (id: string, name = `Artist ${id}`): JellyfinItem => ({
  Id: id,
  Name: name,
  Type: 'MusicArtist',
});

describe('buildDailyMixes', () => {
  it('labels each mix "<Artist> Mix" seeded from the artist', () => {
    const mixes = buildDailyMixes([artist('a', 'Radiohead')]);
    expect(mixes).toEqual([{ seed: expect.objectContaining({ Id: 'a' }), title: 'Radiohead Mix' }]);
  });

  it('caps the number of mixes', () => {
    const many = Array.from({ length: 20 }, (_, i) => artist(String(i)));
    expect(buildDailyMixes(many)).toHaveLength(MIX_COUNT);
  });

  it('skips artists missing an id or name', () => {
    const mixes = buildDailyMixes([
      { Id: '', Name: 'No id', Type: 'MusicArtist' },
      { Id: 'x', Type: 'MusicArtist' } as JellyfinItem,
      artist('ok', 'Real'),
    ]);
    expect(mixes.map((m) => m.title)).toEqual(['Real Mix']);
  });

  it('returns an empty list when there are no artists', () => {
    expect(buildDailyMixes([])).toEqual([]);
  });
});
