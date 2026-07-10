import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { IonSearchbar, IonIcon } from '@ionic/react';
import { swapVertical } from 'ionicons/icons';
import { LoadState } from '../../components/LoadState';
import { TrackListSkeleton } from '../../components/Skeleton';
import { LibraryFilters } from './LibraryFilters';
import { LibraryRowItem } from './LibraryRowItem';
import { CreatePlaylist } from '../playlists/CreatePlaylist';
import { usePlaylists } from '../playlists/playlistsApi';
import { useLikedSongs, useSavedAlbums, useFollowedArtists } from './libraryApi';
import { getRecentPlays } from './recentPlays';
import { filterFromSearch, type LibraryFilter } from './libraryRows';
import { composeLibraryRows, type LibrarySort } from './librarySort';
import './libraryList.css';

const EMPTY: Record<LibraryFilter, string> = {
  playlists: 'No playlists yet. Create one, then add songs from anywhere.',
  albums: 'No saved albums yet. Tap the + on any album to save it.',
  artists: 'No followed artists yet. Tap the + on any artist to follow them.',
};

/** Your Library as one filterable list — Playlists (Liked Songs pinned first),
 * Albums, or Artists — matching Spotify's unified library. */
export function LibraryList() {
  // Seed the filter from ?filter= so a Home "Show all" link (e.g. Your artists)
  // lands on the right section instead of the default Playlists.
  const { search } = useLocation();
  const [filter, setFilter] = useState<LibraryFilter>(() => filterFromSearch(search));
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<LibrarySort>('recents');
  const playlists = usePlaylists();
  const albums = useSavedAlbums();
  const artists = useFollowedArtists();
  const liked = useLikedSongs();

  const active = filter === 'albums' ? albums : filter === 'artists' ? artists : playlists;
  const rows = composeLibraryRows(
    filter,
    {
      playlists: playlists.playlists,
      albums: albums.albums,
      artists: artists.artists,
      likedCount: liked.songs.length,
    },
    query,
    sort,
    getRecentPlays(),
  );

  return (
    <>
      <div className="library-list__head">
        <LibraryFilters filter={filter} onChange={setFilter} />
        {filter === 'playlists' && <CreatePlaylist />}
      </div>
      <div className="library-list__tools">
        <IonSearchbar
          className="library-list__search"
          value={query}
          debounce={0}
          placeholder="Filter in Your Library"
          onIonInput={(e) => setQuery(e.detail.value ?? '')}
          data-testid="library-search"
        />
        <button
          type="button"
          className={
            sort === 'alpha' ? 'library-list__sort library-list__sort--on' : 'library-list__sort'
          }
          data-testid="library-sort"
          aria-label={sort === 'alpha' ? 'Sorted A–Z; tap for recents' : 'Sort A–Z'}
          aria-pressed={sort === 'alpha'}
          onClick={() => setSort((s) => (s === 'alpha' ? 'recents' : 'alpha'))}
        >
          <IonIcon icon={swapVertical} />
        </button>
      </div>
      <LoadState
        isLoading={active.isLoading}
        isError={active.isError}
        onRetry={() => void active.refetch()}
        isEmpty={rows.length === 0}
        emptyTitle={query ? 'No matches' : 'Nothing here yet'}
        emptyMessage={query ? `Nothing in Your Library matches "${query}".` : EMPTY[filter]}
        skeleton={<TrackListSkeleton />}
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
