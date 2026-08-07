import { describe, expect, it } from 'vitest';
import { favoritePlaylists } from './favoritePlaylists';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const pl = (id: string, fav?: boolean): JellyfinItem => ({
  Id: id,
  Name: id,
  Type: 'Playlist',
  UserData: fav ? { IsFavorite: true } : {},
});

describe('favoritePlaylists', () => {
  it('keeps only hearted playlists, preserving order', () => {
    const out = favoritePlaylists([pl('a', true), pl('b'), pl('c', true)]);
    expect(out.map((p) => p.Id)).toEqual(['a', 'c']);
  });

  it('is empty when none are favorited', () => {
    expect(favoritePlaylists([pl('a'), pl('b')])).toEqual([]);
  });
});
