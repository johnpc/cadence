import { describe, expect, it } from 'vitest';
import { sortPlaylistTracks } from './sortPlaylistTracks';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const t = (id: string, name: string, artist: string): JellyfinItem => ({
  Id: id,
  Name: name,
  Type: 'Audio',
  Artists: [artist],
});

const tracks = [t('1', 'Zebra', 'Beck'), t('2', 'Apple', 'Zappa'), t('3', 'Mango', 'Adele')];

describe('sortPlaylistTracks', () => {
  it('returns the saved order unchanged for custom', () => {
    expect(sortPlaylistTracks(tracks, 'custom').map((x) => x.Id)).toEqual(['1', '2', '3']);
  });

  it('sorts by title case-insensitively', () => {
    expect(sortPlaylistTracks(tracks, 'title').map((x) => x.Name)).toEqual([
      'Apple',
      'Mango',
      'Zebra',
    ]);
  });

  it('sorts by artist', () => {
    expect(sortPlaylistTracks(tracks, 'artist').map((x) => x.Artists?.[0])).toEqual([
      'Adele',
      'Beck',
      'Zappa',
    ]);
  });

  it('does not mutate the input array', () => {
    const input = [...tracks];
    sortPlaylistTracks(input, 'title');
    expect(input.map((x) => x.Id)).toEqual(['1', '2', '3']);
  });
});
