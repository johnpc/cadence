import {
  IonButtons,
  IonBackButton,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { useParams } from 'react-router-dom';
import { LoadState } from '../../components/LoadState';
import { TrackListSkeleton } from '../../components/Skeleton';
import { TrackRow } from '../player/TrackRow';
import { CollectionActions } from '../player/CollectionActions';
import { useProgressiveList } from '../../lib/useProgressiveList';
import { useArtist, useArtistTracks } from './artistApi';

/** Every track by an artist (A–Z) — the "See all" destination from the artist
 * page's Popular preview. Playable as a queue; virtualised for large catalogues. */
export function ArtistTracksPage() {
  const { id } = useParams<{ id: string }>();
  const { artist } = useArtist(id);
  const { tracks, isLoading, isError, refetch } = useArtistTracks(id);
  const ctx = { kind: 'artist', label: artist?.Name ?? 'Artist', path: `/artist/${id}` };
  const { limit, sentinelRef, hasMore } = useProgressiveList(tracks.length);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref={`/artist/${id}`} />
          </IonButtons>
          <IonTitle>{artist?.Name ?? 'Artist'}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <LoadState
          isLoading={isLoading}
          isError={isError}
          onRetry={() => void refetch()}
          isEmpty={tracks.length === 0}
          emptyTitle="No tracks"
          emptyMessage="This artist has no songs on your server."
          skeleton={<TrackListSkeleton />}
        >
          <div data-testid="artist-tracks">
            <div className="liked__header">
              <h1 className="cad-headline">All songs</h1>
              <CollectionActions tracks={tracks} context={ctx} />
            </div>
            {tracks.slice(0, limit).map((track, index) => (
              <TrackRow key={track.Id} track={track} queue={tracks} index={index} context={ctx} />
            ))}
            {hasMore && (
              <div ref={sentinelRef} data-testid="artist-tracks-more" aria-hidden="true" />
            )}
          </div>
        </LoadState>
      </IonContent>
    </IonPage>
  );
}
