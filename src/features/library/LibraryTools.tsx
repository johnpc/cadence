import { IonSearchbar, IonIcon } from '@ionic/react';
import { swapVertical, gridOutline, listOutline } from 'ionicons/icons';
import type { LibrarySort } from './librarySort';
import type { LibraryView } from './libraryViewStore';

/** The library toolbar: text filter, A–Z/recents sort toggle, and a list/grid
 * view toggle. Extracted from LibraryList to keep that component thin. */
export function LibraryTools({
  query,
  onQuery,
  sort,
  onToggleSort,
  view,
  onToggleView,
}: {
  query: string;
  onQuery: (q: string) => void;
  sort: LibrarySort;
  onToggleSort: () => void;
  view: LibraryView;
  onToggleView: () => void;
}) {
  return (
    <div className="library-list__tools">
      <IonSearchbar
        className="library-list__search"
        value={query}
        debounce={0}
        placeholder="Filter in Your Library"
        onIonInput={(e) => onQuery(e.detail.value ?? '')}
        data-testid="library-search"
      />
      <button
        type="button"
        className={
          sort === 'alpha' ? 'library-list__tool library-list__tool--on' : 'library-list__tool'
        }
        data-testid="library-sort"
        aria-label={sort === 'alpha' ? 'Sorted A–Z; tap for recents' : 'Sort A–Z'}
        aria-pressed={sort === 'alpha'}
        onClick={onToggleSort}
      >
        <IonIcon icon={swapVertical} />
      </button>
      <button
        type="button"
        className="library-list__tool"
        data-testid="library-view"
        aria-label={view === 'grid' ? 'Switch to list view' : 'Switch to grid view'}
        onClick={onToggleView}
      >
        <IonIcon icon={view === 'grid' ? listOutline : gridOutline} />
      </button>
    </div>
  );
}
