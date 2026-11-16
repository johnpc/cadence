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
import { DownloadQueue } from './DownloadQueue';
import { useMusicRequests } from './useMusicRequests';
import './requests.css';

/** "Request music" — search MusicBrainz (via Lidarr) for artists not in the
 * library and request them; requesting an artist monitors their whole
 * discography and downloads it into the shared library, after which it appears
 * in normal search/Home. Open to any signed-in user; only routed when the Lidarr
 * proxy is configured (see AppRoutes). A `?q=` param (from Search's "request
 * this" bridge) pre-fills the search. */
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
        <h1 className="cad-sr-only">Request music</h1>
        <p className="cad-meta requests__hint">
          Looking for music that’s not (yet) on the server? Search for an artist and request them —
          their whole discography is monitored and downloaded into the shared library, and it’ll
          show up in search and Home shortly.
        </p>
        <DownloadQueue />
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
