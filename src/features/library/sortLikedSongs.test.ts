import { describe, expect, it } from 'vitest';
import { sortLikedSongs, LIKED_SORTS } from './sortLikedSongs';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const songs: JellyfinItem[] = [
  { Id: '1', Name: 'Zebra', Type: 'Audio', Artists: ['Muse'] },
  { Id: '2', Name: 'Apple', Type: 'Audio', Artists: ['Radiohead'] },
  { Id: '3', Name: 'Mango', Type: 'Audio', Artists: ['ABBA'] },
];

describe('sortLikedSongs', () => {
  it('leaves the server order unchanged for "recent"', () => {
    expect(sortLikedSongs(songs, 'recent')).toEqual(songs);
  });

  it('sorts by title', () => {
    expect(sortLikedSongs(songs, 'title').map((s) => s.Name)).toEqual(['Apple', 'Mango', 'Zebra']);
  });

  it('sorts by artist', () => {
    expect(sortLikedSongs(songs, 'artist').map((s) => s.Id)).toEqual(['3', '1', '2']);
  });

  it('is stable for equal keys and does not mutate its input', () => {
    const dupes: JellyfinItem[] = [
      { Id: 'a', Name: 'Same', Type: 'Audio' },
      { Id: 'b', Name: 'Same', Type: 'Audio' },
    ];
    expect(sortLikedSongs(dupes, 'title').map((s) => s.Id)).toEqual(['a', 'b']);
    expect(dupes[0].Id).toBe('a'); // original array untouched
  });

  it('exposes the three sort options', () => {
    expect(LIKED_SORTS.map((s) => s.value)).toEqual(['recent', 'title', 'artist']);
  });
});
