import { IonContent, IonHeader, IonPage, IonSearchbar, IonTitle, IonToolbar } from '@ionic/react';
import { useState } from 'react';
import { LoadState } from '../../components/LoadState';
import { TrackListSkeleton } from '../../components/Skeleton';
import { SearchResults } from './SearchResults';
import { SearchFilters, type SearchFilter } from './SearchFilters';
import { RecentSearches } from './RecentSearches';
import { RequestPrompt } from './RequestPrompt';
import { GenreTiles } from '../genre/GenreTiles';
import { useSearch } from './useSearch';
import { useRecentSearches } from './useRecentSearches';
import { useActivateResult } from './useActivateResult';
import './search.css';

/** Search — the primary discovery surface. Songs play; albums/artists open their
 * detail pages. The idle state shows recent searches (like Spotify). */
export function Search() {
  const s = useSearch();
  const { recents, record, remove, clear } = useRecentSearches();
  const [filter, setFilter] = useState<SearchFilter>('all');
  const activateResult = useActivateResult(record);
  // Enter in the search box plays/opens the top result (Spotify-style), so the
  // keyboard-only path doesn't require tabbing to the card.
  const onEnter = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && s.top) activateResult(s.top);
  };

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
            onKeyDown={onEnter}
            data-testid="search-input"
          />
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {/* Toolbar title is a div; give the content a real <h1> for a11y. */}
        <h1 className="cad-sr-only">Search</h1>
        {s.isIdle ? (
          <>
            <RecentSearches recents={recents} onClear={clear} onRemove={remove} />
            <GenreTiles />
          </>
        ) : (
          <>
            <SearchFilters filter={filter} onChange={setFilter} />
            <LoadState
              isLoading={s.isLoading}
              isError={s.isError}
              onRetry={() => void s.refetch()}
              isEmpty={s.isEmpty}
              emptyTitle="No results"
              emptyMessage="Try a different search."
              skeleton={<TrackListSkeleton />}
            >
              <SearchResults groups={s.groups} filter={filter} query={s.query} onPick={record} />
            </LoadState>
            <RequestPrompt query={s.query} show={s.isEmpty} />
          </>
        )}
      </IonContent>
    </IonPage>
  );
}
