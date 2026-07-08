import { useState } from 'react';
import { IonSearchbar } from '@ionic/react';
import { LoadState } from '../../components/LoadState';
import { LibraryFilters } from './LibraryFilters';
import { LibraryRowItem } from './LibraryRowItem';
import { CreatePlaylist } from '../playlists/CreatePlaylist';
import { usePlaylists } from '../playlists/playlistsApi';
import { useLikedSongs, useSavedAlbums, useFollowedArtists } from './libraryApi';
import { buildLibraryRows, filterRowsByText, type LibraryFilter } from './libraryRows';
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
  const [query, setQuery] = useState('');
  const playlists = usePlaylists();
  const albums = useSavedAlbums();
  const artists = useFollowedArtists();
  const liked = useLikedSongs();

  const active = filter === 'albums' ? albums : filter === 'artists' ? artists : playlists;
  const rows = filterRowsByText(
    buildLibraryRows(filter, {
      playlists: playlists.playlists,
      albums: albums.albums,
      artists: artists.artists,
      likedCount: liked.songs.length,
    }),
    query,
  );

  return (
    <>
      <div className="library-list__head">
        <LibraryFilters filter={filter} onChange={setFilter} />
        {filter === 'playlists' && <CreatePlaylist />}
      </div>
      <IonSearchbar
        className="library-list__search"
        value={query}
        debounce={0}
        placeholder="Filter in Your Library"
        onIonInput={(e) => setQuery(e.detail.value ?? '')}
        data-testid="library-search"
      />
      <LoadState
        isLoading={active.isLoading}
        isError={active.isError}
        onRetry={() => void active.refetch()}
        isEmpty={rows.length === 0}
        emptyTitle={query ? 'No matches' : 'Nothing here yet'}
        emptyMessage={query ? `Nothing in Your Library matches "${query}".` : EMPTY[filter]}
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
