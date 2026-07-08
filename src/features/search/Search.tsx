import { IonContent, IonHeader, IonPage, IonSearchbar, IonTitle, IonToolbar } from '@ionic/react';
import { LoadState } from '../../components/LoadState';
import { TrackListSkeleton } from '../../components/Skeleton';
import { SearchResults } from './SearchResults';
import { RecentSearches } from './RecentSearches';
import { useSearch } from './useSearch';
import { useRecentSearches } from './useRecentSearches';
import './search.css';

/** Search — the primary discovery surface. Songs play; albums/artists open their
 * detail pages. The idle state shows recent searches (like Spotify). */
export function Search() {
  const s = useSearch();
  const { recents, record, clear } = useRecentSearches();

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
          <RecentSearches recents={recents} onClear={clear} />
        ) : (
          <LoadState
            isLoading={s.isLoading}
            isError={s.isError}
            onRetry={() => void s.refetch()}
            isEmpty={s.isEmpty}
            emptyTitle="No results"
            emptyMessage="Try a different search."
            skeleton={<TrackListSkeleton />}
          >
            <SearchResults groups={s.groups} onPick={record} />
          </LoadState>
        )}
      </IonContent>
    </IonPage>
  );
}
