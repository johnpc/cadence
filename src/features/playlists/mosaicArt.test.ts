import { afterEach, describe, expect, it } from 'vitest';
import { mosaicUrls } from './mosaicArt';
import { setServerUrl } from '../../lib/serverUrlStore';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

// imageUrl() builds `${serverUrl}/Items/{id}/Images/Primary?...`, so point the
// store at a known base and assert the returned tiles reference the right ids.
setServerUrl('https://jf.test');
afterEach(() => setServerUrl('https://jf.test'));

const withOwnArt = (id: string): JellyfinItem => ({
  Id: id,
  Name: id,
  Type: 'Audio',
  ImageTags: { Primary: 'tag' },
});
const withAlbum = (id: string, albumId: string): JellyfinItem => ({
  Id: id,
  Name: id,
  Type: 'Audio',
  AlbumId: albumId,
});
const noArt = (id: string): JellyfinItem => ({ Id: id, Name: id, Type: 'Audio' });

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
    expect(urls[0]).toContain('/Items/a/Images/Primary');
    expect(urls[3]).toContain('/Items/d/Images/Primary');
  });

  it('dedupes by source image id (album), so it is not 4 copies of one album', () => {
    const urls = mosaicUrls([
      withAlbum('t1', 'album1'),
      withAlbum('t2', 'album1'),
      withAlbum('t3', 'album2'),
    ]);
    // Two distinct albums → two tiles (both keyed on the album id).
    expect(urls).toHaveLength(2);
    expect(urls[0]).toContain('/Items/album1/Images/Primary');
    expect(urls[1]).toContain('/Items/album2/Images/Primary');
  });

  it('skips tracks with no art', () => {
    expect(mosaicUrls([noArt('x'), noArt('y')])).toEqual([]);
  });

  it('returns [] for an empty tracklist', () => {
    expect(mosaicUrls([])).toEqual([]);
  });
});
