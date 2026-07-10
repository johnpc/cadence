import { IonSearchbar, IonSelect, IonSelectOption } from '@ionic/react';
import { PLAYLIST_SORTS, type PlaylistSort } from './sortPlaylistTracks';

/** The playlist's tools row: a "Find in playlist" box and a sort selector
 * (Custom order / Title / Artist). Kept separate so PlaylistTracks stays thin. */
export function PlaylistTools({
  query,
  onQuery,
  sort,
  onSort,
}: {
  query: string;
  onQuery: (q: string) => void;
  sort: PlaylistSort;
  onSort: (s: PlaylistSort) => void;
}) {
  return (
    <div className="playlist__tools">
      <IonSearchbar
        className="playlist__search"
        value={query}
        debounce={0}
        placeholder="Find in playlist"
        onIonInput={(e) => onQuery(e.detail.value ?? '')}
        data-testid="playlist-search"
      />
      <IonSelect
        className="playlist__sort"
        value={sort}
        interface="popover"
        aria-label="Sort playlist"
        data-testid="playlist-sort"
        onIonChange={(e) => onSort(e.detail.value as PlaylistSort)}
      >
        {PLAYLIST_SORTS.map((s) => (
          <IonSelectOption key={s.value} value={s.value}>
            {s.label}
          </IonSelectOption>
        ))}
      </IonSelect>
    </div>
  );
}
