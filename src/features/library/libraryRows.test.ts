import { describe, expect, it } from 'vitest';
import { buildLibraryRows, filterRowsByText } from './libraryRows';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const pl: JellyfinItem[] = [{ Id: 'p1', Name: 'Road Trip', Type: 'Playlist' }];
const al: JellyfinItem[] = [
  { Id: 'a1', Name: 'OK Computer', Type: 'MusicAlbum', AlbumArtist: 'Radiohead' },
];
const ar: JellyfinItem[] = [{ Id: 'ar1', Name: 'Radiohead', Type: 'MusicArtist' }];
const data = { playlists: pl, albums: al, artists: ar, likedCount: 3 };

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
