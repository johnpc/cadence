import { describe, expect, it } from 'vitest';
import { buildLibraryRows, filterRowsByText, filterFromSearch } from './libraryRows';
import { sortRows } from './librarySort';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

describe('filterFromSearch', () => {
  it('reads a valid ?filter= value', () => {
    expect(filterFromSearch('?filter=artists')).toBe('artists');
    expect(filterFromSearch('?filter=albums')).toBe('albums');
    expect(filterFromSearch('?filter=playlists')).toBe('playlists');
  });

  it('defaults to playlists for missing/unknown values', () => {
    expect(filterFromSearch('')).toBe('playlists');
    expect(filterFromSearch('?filter=bogus')).toBe('playlists');
    expect(filterFromSearch('?other=x')).toBe('playlists');
  });
});

const pl: JellyfinItem[] = [{ Id: 'p1', Name: 'Road Trip', Type: 'Playlist' }];
const al: JellyfinItem[] = [
  { Id: 'a1', Name: 'OK Computer', Type: 'MusicAlbum', AlbumArtist: 'Radiohead' },
];
const ar: JellyfinItem[] = [{ Id: 'ar1', Name: 'Radiohead', Type: 'MusicArtist' }];
const data = { playlists: pl, albums: al, artists: ar, likedCount: 3, downloadsCount: 0 };

describe('buildLibraryRows', () => {
  it('pins Liked Songs first under playlists, then the playlists', () => {
    const rows = buildLibraryRows('playlists', data);
    expect(rows[0].liked).toBe(true);
    expect(rows[0].to).toBe('/liked');
    expect(rows[0].subtitle).toBe('Playlist • 3 songs');
    expect(rows[1].name).toBe('Road Trip');
    expect(rows[1].to).toBe('/playlist/p1');
  });

  it('lists saved albums (square) linking to the album page', () => {
    const rows = buildLibraryRows('albums', data);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ name: 'OK Computer', to: '/album/a1', round: false });
    expect(rows[0].subtitle).toBe('Radiohead');
  });

  it('lists followed artists (round) linking to the artist page', () => {
    const rows = buildLibraryRows('artists', data);
    expect(rows[0]).toMatchObject({ name: 'Radiohead', to: '/artist/ar1', round: true });
  });

  it('uses the singular for a single liked song', () => {
    const rows = buildLibraryRows('playlists', { ...data, likedCount: 1 });
    expect(rows[0].subtitle).toBe('Playlist • 1 song');
  });

  it('pins Downloads (after Liked Songs) only when there are downloads', () => {
    expect(buildLibraryRows('playlists', data).some((r) => r.downloads)).toBe(false);
    const withDl = buildLibraryRows('playlists', { ...data, downloadsCount: 2 });
    expect(withDl[0].liked).toBe(true);
    expect(withDl[1].downloads).toBe(true);
    expect(withDl[1].to).toBe('/downloads');
    expect(withDl[1].subtitle).toBe('Playlist • 2 songs');
    expect(withDl[2].name).toBe('Road Trip');
  });
});

describe('filterRowsByText', () => {
  const rows = buildLibraryRows('playlists', data); // [Liked Songs, Road Trip]

  it('returns all rows for a blank query', () => {
    expect(filterRowsByText(rows, '  ')).toHaveLength(rows.length);
  });

  it('matches by name, case-insensitively', () => {
    expect(filterRowsByText(rows, 'road').map((r) => r.name)).toEqual(['Road Trip']);
    expect(filterRowsByText(rows, 'LIKED').map((r) => r.name)).toEqual(['Liked Songs']);
  });

  it('returns nothing when no name matches', () => {
    expect(filterRowsByText(rows, 'zzz')).toEqual([]);
  });
});

describe('sortRows', () => {
  const albumRows = buildLibraryRows('albums', {
    playlists: [],
    albums: [
      { Id: 'b', Name: 'Zebra', Type: 'MusicAlbum' },
      { Id: 'a', Name: 'Apple', Type: 'MusicAlbum' },
    ],
    artists: [],
    likedCount: 0,
    downloadsCount: 0,
  });

  it('keeps server order under recents when nothing has been played', () => {
    expect(sortRows(albumRows, 'recents').map((r) => r.name)).toEqual(['Zebra', 'Apple']);
  });

  it('bubbles a recently-played item to the top under recents', () => {
    // Apple (id 'a') played more recently than Zebra (id 'b').
    expect(sortRows(albumRows, 'recents', { a: 200, b: 100 }).map((r) => r.name)).toEqual([
      'Apple',
      'Zebra',
    ]);
  });

  it('sorts alphabetically by name', () => {
    expect(sortRows(albumRows, 'alpha').map((r) => r.name)).toEqual(['Apple', 'Zebra']);
  });

  it('keeps the pinned Liked Songs row first in both orders', () => {
    const playlistRows = buildLibraryRows('playlists', {
      playlists: [{ Id: 'p', Name: 'Aaa First Alpha', Type: 'Playlist' }],
      albums: [],
      artists: [],
      likedCount: 2,
      downloadsCount: 0,
    });
    expect(sortRows(playlistRows, 'alpha')[0].liked).toBe(true);
    expect(sortRows(playlistRows, 'recents', { p: 999 })[0].liked).toBe(true);
  });

  it('keeps both pinned rows (Liked Songs, Downloads) first in both orders', () => {
    const rows = buildLibraryRows('playlists', {
      playlists: [{ Id: 'p', Name: 'Aaa First Alpha', Type: 'Playlist' }],
      albums: [],
      artists: [],
      likedCount: 2,
      downloadsCount: 1,
    });
    const alpha = sortRows(rows, 'alpha');
    expect([alpha[0].liked, alpha[1].downloads]).toEqual([true, true]);
    const recents = sortRows(rows, 'recents', { p: 999 });
    expect([recents[0].liked, recents[1].downloads]).toEqual([true, true]);
  });
});
