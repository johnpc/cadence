import { IonSearchbar, IonSelect, IonSelectOption } from '@ionic/react';
import { BOOK_SORTS, type BookSort } from './sortBooks';
import './audiobookControls.css';

/** The Audiobooks tools row: a "Find an audiobook" box and a sort selector
 * (A–Z / Recently added / Recently played). Mirrors LikedSongsControls. */
export function AudiobookControls({
  query,
  onQuery,
  sort,
  onSort,
}: {
  query: string;
  onQuery: (q: string) => void;
  sort: BookSort;
  onSort: (s: BookSort) => void;
}) {
  return (
    <div className="ab-tools">
      <IonSearchbar
        className="ab-tools__search"
        value={query}
        onIonInput={(e) => onQuery(e.detail.value ?? '')}
        placeholder="Find an audiobook"
        data-testid="audiobook-search"
      />
      <IonSelect
        className="ab-tools__sort"
        value={sort}
        interface="popover"
        aria-label="Sort audiobooks"
        data-testid="audiobook-sort"
        onIonChange={(e) => onSort(e.detail.value as BookSort)}
      >
        {BOOK_SORTS.map((s) => (
          <IonSelectOption key={s.value} value={s.value}>
            {s.label}
          </IonSelectOption>
        ))}
      </IonSelect>
    </div>
  );
}
