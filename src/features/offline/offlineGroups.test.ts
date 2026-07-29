import { describe, expect, it } from 'vitest';
import { toAlbums, toArtists, toPlaylists } from './offlineGroups';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const track = (over: Partial<JellyfinItem>): JellyfinItem =>
  ({ Id: over.Id ?? 'x', Name: over.Name ?? 'x', Type: 'Audio', ...over }) as JellyfinItem;

describe('toAlbums', () => {
  it('groups tracks by AlbumId, titled by Album name', () => {
    const albums = toAlbums([
      track({ Id: 'a', Album: 'Dune', AlbumId: 'al1' }),
      track({ Id: 'b', Album: 'Dune', AlbumId: 'al1' }),
      track({ Id: 'c', Album: 'Other', AlbumId: 'al2' }),
    ]);
    expect(albums).toHaveLength(2);
    expect(albums[0].title).toBe('Dune');
    expect(albums[0].tracks).toHaveLength(2);
    expect(albums[0].subtitle).toBe('2 songs');
    expect(albums[0].round).toBe(false);
  });

  it('falls back to the Album name as the group key when there is no AlbumId', () => {
    const albums = toAlbums([track({ Id: 'a', Album: 'Loose' })]);
    expect(albums[0].id).toBe('album:Loose');
    expect(albums[0].subtitle).toBe('1 song');
  });

  it('skips tracks with no album at all', () => {
    expect(toAlbums([track({ Id: 'a' })])).toHaveLength(0);
  });
});

describe('toArtists', () => {
  it('groups by primary artist id and renders round tiles', () => {
    const artists = toArtists([
      track({ Id: 'a', ArtistItems: [{ Id: 'ar1', Name: 'Herbert' }] }),
      track({ Id: 'b', ArtistItems: [{ Id: 'ar1', Name: 'Herbert' }] }),
    ]);
    expect(artists).toHaveLength(1);
    expect(artists[0].title).toBe('Herbert');
    expect(artists[0].round).toBe(true);
  });

  it('falls back to AlbumArtist when there are no ArtistItems', () => {
    const artists = toArtists([track({ Id: 'a', AlbumArtist: 'Solo' })]);
    expect(artists[0].title).toBe('Solo');
    expect(artists[0].id).toBe('artist:Solo');
  });
});

describe('toPlaylists', () => {
  const music = [track({ Id: 'a' }), track({ Id: 'b' }), track({ Id: 'c' })];

  it('rebuilds a saved playlist in stored order, intersected with downloads', () => {
    const groups = toPlaylists(music, [{ id: 'p1', name: 'Mix', trackIds: ['c', 'a'] }]);
    expect(groups).toHaveLength(1);
    expect(groups[0].title).toBe('Mix');
    expect(groups[0].tracks.map((t) => t.Id)).toEqual(['c', 'a']);
  });

  it('drops track ids that are not downloaded, and empty playlists entirely', () => {
    const groups = toPlaylists(music, [
      { id: 'p1', name: 'Partly', trackIds: ['a', 'missing'] },
      { id: 'p2', name: 'Gone', trackIds: ['missing'] },
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].tracks.map((t) => t.Id)).toEqual(['a']);
  });
});
