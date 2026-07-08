import { useState } from 'react';
import { LoadState } from '../../components/LoadState';
import { LibraryFilters } from './LibraryFilters';
import { LibraryRowItem } from './LibraryRowItem';
import { CreatePlaylist } from '../playlists/CreatePlaylist';
import { usePlaylists } from '../playlists/playlistsApi';
import { useLikedSongs, useSavedAlbums, useFollowedArtists } from './libraryApi';
import { buildLibraryRows, type LibraryFilter } from './libraryRows';
import './libraryList.css';

const EMPTY: Record<LibraryFilter, string> = {
  playlists: 'No playlists yet. Create one, then add songs from anywhere.',
  albums: 'No saved albums yet. Tap the + on any album to save it.',
  artists: 'No followed artists yet. Tap the + on any artist to follow them.',
};

/** Your Library as one filterable list — Playlists (Liked Songs pinned first),
 * Albums, or Artists — matching Spotify's unified library. */
export function LibraryList() {
  const [filter, setFilter] = useState<LibraryFilter>('playlists');
  const playlists = usePlaylists();
  const albums = useSavedAlbums();
  const artists = useFollowedArtists();
  const liked = useLikedSongs();

  const active = filter === 'albums' ? albums : filter === 'artists' ? artists : playlists;
  const rows = buildLibraryRows(filter, {
    playlists: playlists.playlists,
    albums: albums.albums,
    artists: artists.artists,
    likedCount: liked.songs.length,
  });

  return (
    <>
      <div className="library-list__head">
        <LibraryFilters filter={filter} onChange={setFilter} />
        {filter === 'playlists' && <CreatePlaylist />}
      </div>
      <LoadState
        isLoading={active.isLoading}
        isError={active.isError}
        onRetry={() => void active.refetch()}
        isEmpty={rows.length === 0}
        emptyTitle="Nothing here yet"
        emptyMessage={EMPTY[filter]}
      >
        <div data-testid="library-list">
          {rows.map((row) => (
            <LibraryRowItem key={row.id} row={row} />
          ))}
        </div>
      </LoadState>
    </>
  );
}
