import {
  IonButtons,
  IonBackButton,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { Link, useParams } from 'react-router-dom';
import { LoadState } from '../../components/LoadState';
import { TrackArt } from '../player/TrackArt';
import { LikeButton } from '../library/LikeButton';
import { ShareButton } from '../share/ShareButton';
import { usePlayer } from '../player/usePlayer';
import { trackDuration } from '../player/playerFormat';
import { SongLinks } from './SongLinks';
import { useSong, useSongPlaylists } from './songApi';
import './song.css';

/** A track's own page: art, title, links to its artist(s) + album, play/like/
 * share, and the playlists it appears in. */
export function SongDetail() {
  const { id } = useParams<{ id: string }>();
  const { song, isLoading, isError, refetch } = useSong(id);
  const { playlists } = useSongPlaylists(id);
  const { playQueue } = usePlayer();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>{song?.Name ?? 'Song'}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <LoadState isLoading={isLoading} isError={isError} onRetry={() => void refetch()}>
          <div data-testid="song-detail">
            <div className="song__header">
              <TrackArt item={song} size={200} />
              <h1 className="song__title cad-headline">{song?.Name}</h1>
              {song && <SongLinks song={song} />}
              {song && trackDuration(song.RunTimeTicks) && (
                <p className="song__meta cad-meta">{trackDuration(song.RunTimeTicks)}</p>
              )}
              <div className="song__actions">
                {song && <LikeButton track={song} size={26} />}
                <button
                  className="song__play"
                  data-testid="song-play"
                  aria-label="Play"
                  onClick={() => song && playQueue([song], 0)}
                >
                  ▶
                </button>
                <ShareButton item={song} />
              </div>
            </div>
            {playlists.length > 0 && (
              <section data-testid="song-playlists">
                <h2 className="cad-kicker song__section">Appears in</h2>
                {playlists.map((pl) => (
                  <Link key={pl.Id} className="song__playlist" to={`/playlist/${pl.Id}`}>
                    {pl.Name}
                  </Link>
                ))}
              </section>
            )}
          </div>
        </LoadState>
      </IonContent>
    </IonPage>
  );
}
