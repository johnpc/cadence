import { useMemo, useState } from 'react';
import { LoadState } from '../../components/LoadState';
import { TrackListSkeleton } from '../../components/Skeleton';
import { TrackRow } from '../player/TrackRow';
import { CollectionActions } from '../player/CollectionActions';
import { collectionSummary } from '../player/playerFormat';
import { LikedSongsControls } from './LikedSongsControls';
import { sortLikedSongs, type LikedSort } from './sortLikedSongs';
import { filterTracks } from '../playlists/filterTracks';
import { useProgressiveList } from '../../lib/useProgressiveList';
import { useLikedSongs } from './libraryApi';
import './likedSongs.css';

/** The "Liked Songs" collection — the user's Jellyfin favorites, with a find
 * box and a sort selector (Recently added / Title / Artist) once the list is
 * large enough to warrant them. */
export function LikedSongs() {
  const { songs, isLoading, isError, refetch } = useLikedSongs();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<LikedSort>('recent');

  const shown = useMemo(
    () => filterTracks(sortLikedSongs(songs, sort), query),
    [songs, sort, query],
  );
  // Render a growing window so a large Liked Songs list paints fast.
  const { limit, sentinelRef, hasMore } = useProgressiveList(shown.length);

  return (
    <LoadState
      isLoading={isLoading}
      isError={isError}
      onRetry={() => void refetch()}
      isEmpty={songs.length === 0}
      emptyTitle="No liked songs yet"
      emptyMessage="Tap the heart on any song to add it here."
      skeleton={<TrackListSkeleton />}
    >
      <div data-testid="liked-songs">
        <div className="liked__header">
          <div className="liked__titles">
            <h2 className="cad-headline">Liked Songs</h2>
            <p className="cad-meta" data-testid="liked-summary">
              {collectionSummary(songs)}
            </p>
          </div>
          <CollectionActions
            tracks={shown}
            context={{ kind: 'your library', label: 'Liked Songs' }}
          />
        </div>
        {songs.length > 8 && (
          <LikedSongsControls query={query} onQuery={setQuery} sort={sort} onSort={setSort} />
        )}
        {shown.slice(0, limit).map((track, index) => (
          <TrackRow key={track.Id} track={track} queue={shown} index={index} />
        ))}
        {hasMore && <div ref={sentinelRef} data-testid="liked-load-more" aria-hidden="true" />}
        {query.trim() && shown.length === 0 && (
          <p className="cad-meta" data-testid="liked-no-matches">
            No liked songs match “{query}”.
          </p>
        )}
      </div>
    </LoadState>
  );
}
