import { describe, expect, it } from 'vitest';
import { groupResults, isEmptyGroups, topResult } from './searchGroups';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const item = (id: string, Type: string): JellyfinItem => ({ Id: id, Name: id, Type });
const named = (name: string, Type: string): JellyfinItem => ({ Id: name, Name: name, Type });

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

describe('topResult', () => {
  it('is null for a blank query or no results', () => {
    expect(topResult(groupResults([]), 'x')).toBeNull();
    expect(topResult(groupResults([item('s', 'Audio')]), '   ')).toBeNull();
  });

  it('prefers an exact name match', () => {
    const groups = groupResults([named('Love Song', 'Audio'), named('Love', 'MusicArtist')]);
    expect(topResult(groups, 'love')?.Name).toBe('Love');
  });

  it('prefers a non-song (artist/album) over a song on equal name match', () => {
    const groups = groupResults([named('Adele', 'Audio'), named('Adele', 'MusicArtist')]);
    expect(topResult(groups, 'adele')?.Type).toBe('MusicArtist');
  });

  it('falls back to a prefix/substring match', () => {
    const groups = groupResults([named('Yesterday Once More', 'Audio')]);
    expect(topResult(groups, 'yesterday')?.Name).toBe('Yesterday Once More');
  });
});
