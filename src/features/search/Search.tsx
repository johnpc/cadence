import { IonContent, IonHeader, IonPage, IonSearchbar, IonTitle, IonToolbar } from '@ionic/react';
import { LoadState } from '../../components/LoadState';
import { TrackRow } from '../player/TrackRow';
import { usePlayItem } from '../player/usePlayItem';
import { artistLine } from '../player/playerFormat';
import { ResultRow } from './ResultRow';
import { useSearch } from './useSearch';
import './search.css';

/** Search — the primary discovery surface. Songs play; albums/artists start. */
export function Search() {
  const s = useSearch();
  const playItem = usePlayItem();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Search</IonTitle>
        </IonToolbar>
        <IonToolbar>
          <IonSearchbar
            value={s.query}
            debounce={0}
            placeholder="Songs, albums, artists"
            onIonInput={(e) => s.setQuery(e.detail.value ?? '')}
            data-testid="search-input"
          />
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {s.isIdle ? (
          <p className="cad-meta" data-testid="search-idle">
            Search your library.
          </p>
        ) : (
          <LoadState
            isLoading={s.isLoading}
            isError={s.isError}
            onRetry={() => void s.refetch()}
            isEmpty={s.isEmpty}
            emptyTitle="No results"
            emptyMessage="Try a different search."
          >
            <div data-testid="search-results">
              {s.groups.songs.length > 0 && (
                <section>
                  <h2 className="cad-kicker search__section">Songs</h2>
                  {s.groups.songs.map((t, i) => (
                    <TrackRow key={t.Id} track={t} queue={s.groups.songs} index={i} />
                  ))}
                </section>
              )}
              {s.groups.albums.length > 0 && (
                <section>
                  <h2 className="cad-kicker search__section">Albums</h2>
                  {s.groups.albums.map((a) => (
                    <ResultRow key={a.Id} item={a} subtitle={artistLine(a)} onSelect={playItem} />
                  ))}
                </section>
              )}
              {s.groups.artists.length > 0 && (
                <section>
                  <h2 className="cad-kicker search__section">Artists</h2>
                  {s.groups.artists.map((a) => (
                    <ResultRow key={a.Id} item={a} subtitle="Artist" onSelect={playItem} />
                  ))}
                </section>
              )}
            </div>
          </LoadState>
        )}
      </IonContent>
    </IonPage>
  );
}
