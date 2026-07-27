import { describe, expect, it } from 'vitest';
import {
  mediaItemFromSong,
  mediaItemFromAlbum,
  mediaItemFromArtist,
  mediaItemFromPlaylist,
  mediaItemFromPlaylistEntry,
} from './navidromeMapper';

describe('mediaItemFromSong', () => {
  it('maps title to Name and converts duration seconds to .NET ticks', () => {
    const item = mediaItemFromSong({
      id: 's1',
      title: 'A Song',
      album: 'An Album',
      albumId: 'al1',
      track: 3,
      discNumber: 1,
      year: 2020,
      duration: 200,
      genre: 'Rock',
      coverArt: 'cover-1',
    });
    expect(item).toMatchObject({
      Id: 's1',
      Name: 'A Song',
      Type: 'Audio',
      Album: 'An Album',
      AlbumId: 'al1',
      IndexNumber: 3,
      ParentIndexNumber: 1,
      ProductionYear: 2020,
      RunTimeTicks: 2_000_000_000,
      Genres: ['Rock'],
      ImageTags: { Primary: 'cover-1' },
    });
  });

  it('prefers the linkable artists[] array over the single artist string', () => {
    const item = mediaItemFromSong({
      id: 's1',
      title: 'x',
      artist: 'Solo Name',
      artists: [{ id: 'a1', name: 'Real Name' }],
    });
    expect(item.Artists).toEqual(['Real Name']);
    expect(item.ArtistItems).toEqual([{ Id: 'a1', Name: 'Real Name' }]);
  });

  it('falls back to the single artist string when artists[] is absent', () => {
    const item = mediaItemFromSong({ id: 's1', title: 'x', artist: 'Solo Name' });
    expect(item.Artists).toEqual(['Solo Name']);
    expect(item.ArtistItems).toBeUndefined();
  });

  it('marks favorite state from the starred timestamp', () => {
    expect(mediaItemFromSong({ id: 's1', title: 'x', starred: '2024-01-01' }).UserData).toEqual({
      IsFavorite: true,
    });
    expect(mediaItemFromSong({ id: 's1', title: 'x' }).UserData).toEqual({ IsFavorite: false });
  });
});

describe('mediaItemFromAlbum', () => {
  it('maps album fields, using songCount as ChildCount', () => {
    const item = mediaItemFromAlbum({
      id: 'al1',
      name: 'An Album',
      artist: 'The Artist',
      songCount: 12,
      year: 2019,
      coverArt: 'cover-2',
    });
    expect(item).toMatchObject({
      Id: 'al1',
      Name: 'An Album',
      Type: 'MusicAlbum',
      AlbumArtist: 'The Artist',
      AlbumId: 'al1',
      ChildCount: 12,
      ProductionYear: 2019,
      ImageTags: { Primary: 'cover-2' },
    });
  });
});

describe('mediaItemFromArtist', () => {
  it('maps artist fields, using albumCount as ChildCount', () => {
    const item = mediaItemFromArtist({ id: 'ar1', name: 'The Artist', albumCount: 5 });
    expect(item).toMatchObject({
      Id: 'ar1',
      Name: 'The Artist',
      Type: 'MusicArtist',
      ChildCount: 5,
    });
  });
});

describe('mediaItemFromPlaylist', () => {
  it('derives CanDelete from owner === currentUsername', () => {
    const mine = mediaItemFromPlaylist(
      {
        id: 'p1',
        name: 'Mix',
        owner: 'me',
        public: false,
        songCount: 3,
        duration: 100,
        created: '',
      },
      'me',
    );
    const theirs = mediaItemFromPlaylist(
      {
        id: 'p2',
        name: 'Their Mix',
        owner: 'someone-else',
        public: true,
        songCount: 3,
        duration: 100,
        created: '',
      },
      'me',
    );
    expect(mine.CanDelete).toBe(true);
    expect(theirs.CanDelete).toBe(false);
  });
});

describe('mediaItemFromPlaylistEntry', () => {
  it('sets PlaylistItemId to the stringified array index', () => {
    const entry = mediaItemFromPlaylistEntry({ id: 's1', title: 'x' }, 4);
    expect(entry.PlaylistItemId).toBe('4');
    expect(entry.Id).toBe('s1');
  });
});
