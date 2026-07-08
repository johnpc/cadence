import { describe, expect, it } from 'vitest';
import { groupResults, isEmptyGroups } from './searchGroups';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const item = (id: string, Type: string): JellyfinItem => ({ Id: id, Name: id, Type });

describe('searchGroups', () => {
  it('splits results into songs, albums, artists, and playlists', () => {
    const groups = groupResults([
      item('s', 'Audio'),
      item('al', 'MusicAlbum'),
      item('ar', 'MusicArtist'),
      item('s2', 'Audio'),
      item('pl', 'Playlist'),
    ]);
    expect(groups.songs).toHaveLength(2);
    expect(groups.albums).toHaveLength(1);
    expect(groups.artists).toHaveLength(1);
    expect(groups.playlists).toHaveLength(1);
  });

  it('detects empty groups', () => {
    expect(isEmptyGroups(groupResults([]))).toBe(true);
    expect(isEmptyGroups(groupResults([item('s', 'Audio')]))).toBe(false);
  });
});
