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
  it('returns the release year', () => {
    expect(albumMeta(album({ ProductionYear: 2015, Genres: ['Rock'] }))).toBe('2015');
    expect(albumMeta(album({ ProductionYear: 1999 }))).toBe('1999');
  });

  it('is empty when the year is unknown', () => {
    expect(albumMeta(album({ Genres: ['Rock'] }))).toBe('');
    expect(albumMeta(album({}))).toBe('');
    expect(albumMeta(null)).toBe('');
  });
});
