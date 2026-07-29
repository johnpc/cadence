import { describe, expect, it } from 'vitest';
import { buildOfflineLibrary } from './offlineLibraryData';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const item = (over: Partial<JellyfinItem>): JellyfinItem =>
  ({ Id: over.Id ?? 'x', Name: over.Name ?? 'x', Type: 'Audio', ...over }) as JellyfinItem;

describe('buildOfflineLibrary', () => {
  it('splits music from audiobooks and derives every view', () => {
    const lib = buildOfflineLibrary(
      [
        item({ Id: 's1', Album: 'Dune', AlbumId: 'al1', ArtistItems: [{ Id: 'ar1', Name: 'H' }] }),
        item({ Id: 's2', Album: 'Dune', AlbumId: 'al1', ArtistItems: [{ Id: 'ar1', Name: 'H' }] }),
        item({ Id: 'bk', Name: 'Circe', Album: 'Circe', Type: 'AudioBook' }),
      ],
      [{ id: 'p1', name: 'Mix', trackIds: ['s1'] }],
    );
    expect(lib.songs).toHaveLength(2); // audiobook excluded from songs
    expect(lib.albums).toHaveLength(1);
    expect(lib.artists).toHaveLength(1);
    expect(lib.audiobooks).toHaveLength(1);
    expect(lib.audiobooks[0].title).toBe('Circe');
    expect(lib.playlists).toHaveLength(1);
  });

  it('returns empty views for an empty index', () => {
    const lib = buildOfflineLibrary([], []);
    expect(lib.songs).toEqual([]);
    expect(lib.albums).toEqual([]);
    expect(lib.artists).toEqual([]);
    expect(lib.audiobooks).toEqual([]);
    expect(lib.playlists).toEqual([]);
  });
});
