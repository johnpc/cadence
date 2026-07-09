import { describe, expect, it } from 'vitest';
import { topRecentIds } from './jumpBackIn';
import { detailPath } from './itemPath';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

describe('topRecentIds', () => {
  it('orders ids by most-recent timestamp, newest first', () => {
    expect(topRecentIds({ a: 100, b: 300, c: 200 })).toEqual(['b', 'c', 'a']);
  });

  it('caps to the limit', () => {
    const plays = { a: 1, b: 2, c: 3, d: 4, e: 5 };
    expect(topRecentIds(plays, 2)).toEqual(['e', 'd']);
  });

  it('returns [] for no plays', () => {
    expect(topRecentIds({})).toEqual([]);
  });
});

describe('detailPath', () => {
  const item = (Type: string): JellyfinItem => ({ Id: 'x', Name: 'x', Type });
  it('routes each collection type to its detail page', () => {
    expect(detailPath(item('MusicArtist'))).toBe('/artist/x');
    expect(detailPath(item('Playlist'))).toBe('/playlist/x');
    expect(detailPath(item('MusicAlbum'))).toBe('/album/x');
  });
  it('falls back to the album page for an unknown type', () => {
    expect(detailPath(item('Audio'))).toBe('/album/x');
  });
});
