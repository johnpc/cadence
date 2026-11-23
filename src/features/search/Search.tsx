import { IonSearchbar } from '@ionic/react';
import { BarPage } from '../../components/barPage/BarPage';
import { useState } from 'react';
import { LoadState } from '../../components/LoadState';
import { TrackListSkeleton } from '../../components/Skeleton';
import { SearchResults } from './SearchResults';
import { SearchFilters, type SearchFilter } from './SearchFilters';
import { RecentSearches } from './RecentSearches';
import { SearchEmptyExtras } from '../../extensions/slots/SearchEmptyExtras';
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
    <BarPage kind="tab-root" title="Search">
      {/* Sticks under the compact bar once the large title scrolls away. */}
      <div className="search__field">
        <IonSearchbar
          value={s.query}
          debounce={0}
          placeholder="Songs, albums, artists"
          onIonInput={(e) => s.setQuery(e.detail.value ?? '')}
          onKeyDown={onEnter}
          data-testid="search-input"
        />
      </div>
      {s.isIdle ? (
        <>
          <RecentSearches recents={recents} onClear={clear} onRemove={remove} />
          <GenreTiles />
        </>
      ) : (
        <>
          <SearchFilters filter={filter} onChange={setFilter} />
          {s.offline && (
            <p className="search__offline-note cad-meta" data-testid="search-offline-note">
              You’re offline — showing songs from your downloads.
            </p>
          )}
          <LoadState
            isLoading={s.isLoading}
            isError={s.isError}
            onRetry={() => void s.refetch()}
            isEmpty={s.isEmpty}
            emptyTitle={s.offline ? 'No downloaded songs match' : 'No results'}
            emptyMessage={
              s.offline
                ? 'With no connection, search looks through your downloads.'
                : 'Try a different search.'
            }
            skeleton={<TrackListSkeleton />}
          >
            <SearchResults groups={s.groups} filter={filter} query={s.query} onPick={record} />
          </LoadState>
          <SearchEmptyExtras query={s.query} show={s.isEmpty && !s.offline} />
        </>
      )}
    </BarPage>
  );
}
