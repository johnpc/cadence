import { IonSearchbar, IonIcon, IonSelect, IonSelectOption } from '@ionic/react';
import { gridOutline, listOutline } from 'ionicons/icons';
import { LIBRARY_SORTS, type LibrarySort } from './librarySort';
import type { LibraryView } from './libraryViewStore';

/** The library toolbar: text filter, a sort dropdown (Recently played / A–Z /
 * Recently added / Recently updated), and a list/grid view toggle. Extracted
 * from LibraryList to keep that component thin. */
export function LibraryTools({
  query,
  onQuery,
  sort,
  onSort,
  view,
  onToggleView,
}: {
  query: string;
  onQuery: (q: string) => void;
  sort: LibrarySort;
  onSort: (sort: LibrarySort) => void;
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
      <IonSelect
        className="library-list__sort"
        value={sort}
        interface="popover"
        aria-label="Sort Your Library"
        data-testid="library-sort"
        data-sort={sort}
        onIonChange={(e) => onSort(e.detail.value as LibrarySort)}
      >
        {LIBRARY_SORTS.map((s) => (
          <IonSelectOption key={s.value} value={s.value}>
            {s.label}
          </IonSelectOption>
        ))}
      </IonSelect>
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
