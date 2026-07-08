import { IonIcon } from '@ionic/react';
import { play } from 'ionicons/icons';
import { LoadState } from '../../components/LoadState';
import { TrackRow } from '../player/TrackRow';
import { usePlayer } from '../player/usePlayer';
import { useLikedSongs } from './libraryApi';
import './likedSongs.css';

/** The "Liked Songs" collection — the user's Jellyfin favorites. */
export function LikedSongs() {
  const { songs, isLoading, isError, refetch } = useLikedSongs();
  const { playQueue } = usePlayer();

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
          <button
            className="liked__play"
            data-testid="liked-play-all"
            onClick={() => playQueue(songs, 0)}
            aria-label="Play liked songs"
          >
            <IonIcon icon={play} />
          </button>
        </div>
        {songs.map((track, index) => (
          <TrackRow key={track.Id} track={track} queue={songs} index={index} />
        ))}
      </div>
    </LoadState>
  );
}
