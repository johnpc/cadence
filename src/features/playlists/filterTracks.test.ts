import { describe, expect, it } from 'vitest';
import { filterTracks } from './filterTracks';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const tracks: JellyfinItem[] = [
  {
    Id: '1',
    Name: 'Paranoid Android',
    Type: 'Audio',
    Album: 'OK Computer',
    Artists: ['Radiohead'],
  },
  { Id: '2', Name: 'Karma Police', Type: 'Audio', Album: 'OK Computer', Artists: ['Radiohead'] },
  { Id: '3', Name: 'Time Is Running Out', Type: 'Audio', Album: 'Absolution', Artists: ['Muse'] },
];

describe('filterTracks', () => {
  it('returns the list unchanged for an empty query', () => {
    expect(filterTracks(tracks, '')).toEqual(tracks);
    expect(filterTracks(tracks, '   ')).toEqual(tracks);
  });

  it('matches on the song title (case-insensitive)', () => {
    expect(filterTracks(tracks, 'karma').map((t) => t.Id)).toEqual(['2']);
  });

  it('matches on the album name', () => {
    expect(filterTracks(tracks, 'ok computer').map((t) => t.Id)).toEqual(['1', '2']);
  });

  it('matches on the artist name', () => {
    expect(filterTracks(tracks, 'muse').map((t) => t.Id)).toEqual(['3']);
  });

  it('returns nothing when no track matches', () => {
    expect(filterTracks(tracks, 'zzz')).toEqual([]);
  });
});
