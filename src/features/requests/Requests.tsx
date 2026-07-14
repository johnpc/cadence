import {
  IonButtons,
  IonBackButton,
  IonContent,
  IonHeader,
  IonPage,
  IonSearchbar,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { useLocation } from 'react-router-dom';
import { LoadState } from '../../components/LoadState';
import { RequestRow } from './RequestRow';
import { useMusicRequests } from './useMusicRequests';
import './requests.css';

/** "Request music" — search MusicBrainz (via Lidarr) for artists not in the
 * library and request them; Lidarr downloads them into the shared library, after
 * which they appear in normal search/Home. Admin-gated + only routed when the
 * Lidarr proxy is configured (see AppRoutes). A `?q=` param (from Search's
 * "request this" bridge) pre-fills the search. */
export function Requests() {
  const initialQuery = new URLSearchParams(useLocation().search).get('q') ?? '';
  const { query, setQuery, results, isSearching, isError, status, request, inLibrary } =
    useMusicRequests(initialQuery);
  const typed = query.trim().length > 1;
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/library" />
          </IonButtons>
          <IonTitle>Request music</IonTitle>
        </IonToolbar>
        <IonToolbar>
          <IonSearchbar
            value={query}
            debounce={0}
            placeholder="Search for an artist to add"
            onIonInput={(e) => setQuery(e.detail.value ?? '')}
            data-testid="requests-search"
          />
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <p className="cad-meta requests__hint">
          Can’t find something? Search for an artist and request it — it’ll be added to the library.
        </p>
        <div data-testid="requests">
          {typed && (
            <LoadState
              isLoading={isSearching}
              isError={isError}
              onRetry={() => setQuery(query)}
              isEmpty={results.length === 0}
              emptyTitle="No artists found"
              emptyMessage="Try a different spelling."
            >
              {results.map((artist) => (
                <RequestRow
                  key={artist.foreignArtistId}
                  artist={artist}
                  status={status[artist.foreignArtistId] ?? 'idle'}
                  inLibrary={inLibrary(artist.foreignArtistId)}
                  onRequest={request}
                />
              ))}
            </LoadState>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
}
