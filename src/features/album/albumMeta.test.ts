import { describe, expect, it } from 'vitest';
import { albumMeta } from './albumMeta';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const album = (over: Partial<JellyfinItem>): JellyfinItem => ({
  Id: 'al',
  Name: 'A',
  Type: 'MusicAlbum',
  ...over,
});

describe('albumMeta', () => {
  it('joins year and genres', () => {
    expect(albumMeta(album({ ProductionYear: 2015, Genres: ['Rock', 'Indie'] }))).toBe(
      '2015 • Rock, Indie',
    );
  });

  it('caps genres at two', () => {
    expect(albumMeta(album({ Genres: ['A', 'B', 'C'] }))).toBe('A, B');
  });

  it('shows just the year when there are no genres', () => {
    expect(albumMeta(album({ ProductionYear: 1999, Genres: [] }))).toBe('1999');
  });

  it('is empty when nothing is known', () => {
    expect(albumMeta(album({}))).toBe('');
    expect(albumMeta(null)).toBe('');
  });
});
