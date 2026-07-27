import { afterEach, describe, expect, it } from 'vitest';
import { mosaicUrls } from './mosaicArt';
import { setServerUrl } from '../../lib/serverUrlStore';
import type { MediaItem } from '../../lib/navidromeTypes';

// imageUrl() builds `${serverUrl}/rest/getCoverArt?id=...`, so point the store
// at a known base and assert the returned tiles reference the right ids.
setServerUrl('https://nd.test');
afterEach(() => setServerUrl('https://nd.test'));

const withOwnArt = (id: string): MediaItem => ({
  Id: id,
  Name: id,
  Type: 'Audio',
  ImageTags: { Primary: 'tag' },
});
const withAlbum = (id: string, albumId: string): MediaItem => ({
  Id: id,
  Name: id,
  Type: 'Audio',
  AlbumId: albumId,
});
const noArt = (id: string): MediaItem => ({ Id: id, Name: id, Type: 'Audio' });

describe('mosaicUrls', () => {
  it('returns up to 4 cover URLs from the tracks', () => {
    const urls = mosaicUrls([
      withOwnArt('a'),
      withOwnArt('b'),
      withOwnArt('c'),
      withOwnArt('d'),
      withOwnArt('e'),
    ]);
    expect(urls).toHaveLength(4);
    expect(urls[0]).toContain('/rest/getCoverArt?');
    expect(urls[0]).toContain('id=a');
    expect(urls[3]).toContain('id=d');
  });

  it('dedupes by source image id (album), so it is not 4 copies of one album', () => {
    const urls = mosaicUrls([
      withAlbum('t1', 'album1'),
      withAlbum('t2', 'album1'),
      withAlbum('t3', 'album2'),
    ]);
    // Two distinct albums → two tiles (both keyed on the album id).
    expect(urls).toHaveLength(2);
    expect(urls[0]).toContain('id=album1');
    expect(urls[1]).toContain('id=album2');
  });

  it('skips tracks with no art', () => {
    expect(mosaicUrls([noArt('x'), noArt('y')])).toEqual([]);
  });

  it('returns [] for an empty tracklist', () => {
    expect(mosaicUrls([])).toEqual([]);
  });
});
