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
import { TrackRow } from '../player/TrackRow';
import { CollectionActions } from '../player/CollectionActions';
import { collectionSummary } from '../player/playerFormat';
import { useOfflineGroup } from './useOfflineGroup';

/** A downloaded album / artist / playlist as its own page, played entirely from
 * local content. Reached from an OfflineTile; everything here is offline-safe. */
export function OfflineGroupPage() {
  const { kind, id } = useParams<{ kind: string; id: string }>();
  const group = useOfflineGroup(kind, decodeURIComponent(id));
  const context = { kind, label: group?.title ?? '' };
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/library" />
          </IonButtons>
          <IonTitle>{group?.title ?? 'Downloaded'}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <LoadState
          isLoading={false}
          isEmpty={!group || group.tracks.length === 0}
          emptyTitle="Not available offline"
          emptyMessage="These downloads may have been removed. Reconnect to browse your full library."
        >
          {group && (
            <div data-testid="offline-group">
              <h1 className="cad-headline">{group.title}</h1>
              <p className="cad-meta">{collectionSummary(group.tracks)}</p>
              <div className="coll-actions">
                <CollectionActions tracks={group.tracks} context={context} />
              </div>
              {group.tracks.map((track, index) => (
                <TrackRow
                  key={track.Id}
                  track={track}
                  queue={group.tracks}
                  index={index}
                  context={context}
                />
              ))}
            </div>
          )}
        </LoadState>
      </IonContent>
    </IonPage>
  );
}
