import { LoadState } from '../../components/LoadState';
import { TrackRow } from '../player/TrackRow';
import { CollectionActions } from '../player/CollectionActions';
import { useLikedSongs } from './libraryApi';
import './likedSongs.css';

/** The "Liked Songs" collection — the user's Jellyfin favorites. */
export function LikedSongs() {
  const { songs, isLoading, isError, refetch } = useLikedSongs();

  return (
    <LoadState
      isLoading={isLoading}
      isError={isError}
      onRetry={() => void refetch()}
      isEmpty={songs.length === 0}
      emptyTitle="No liked songs yet"
      emptyMessage="Tap the heart on any song to add it here."
    >
      <div data-testid="liked-songs">
        <div className="liked__header">
          <h2 className="cad-headline">Liked Songs</h2>
          <CollectionActions tracks={songs} />
        </div>
        {songs.map((track, index) => (
          <TrackRow key={track.Id} track={track} queue={songs} index={index} />
        ))}
      </div>
    </LoadState>
  );
}
