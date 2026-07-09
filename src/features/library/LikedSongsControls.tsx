import { IonSearchbar, IonSelect, IonSelectOption } from '@ionic/react';
import { LIKED_SORTS, type LikedSort } from './sortLikedSongs';

/** The Liked Songs tools row: a "Find in liked songs" box and a sort selector
 * (Recently added / Title / Artist). */
export function LikedSongsControls({
  query,
  onQuery,
  sort,
  onSort,
}: {
  query: string;
  onQuery: (q: string) => void;
  sort: LikedSort;
  onSort: (s: LikedSort) => void;
}) {
  return (
    <div className="liked__tools">
      <IonSearchbar
        className="liked__search"
        value={query}
        debounce={0}
        placeholder="Find in liked songs"
        onIonInput={(e) => onQuery(e.detail.value ?? '')}
        data-testid="liked-search"
      />
      <IonSelect
        className="liked__sort"
        value={sort}
        interface="popover"
        aria-label="Sort liked songs"
        data-testid="liked-sort"
        onIonChange={(e) => onSort(e.detail.value as LikedSort)}
      >
        {LIKED_SORTS.map((s) => (
          <IonSelectOption key={s.value} value={s.value}>
            {s.label}
          </IonSelectOption>
        ))}
      </IonSelect>
    </div>
  );
}
