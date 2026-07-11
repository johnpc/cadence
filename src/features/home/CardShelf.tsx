import { Shelf } from './Shelf';
import { AlbumCard } from './AlbumCard';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

interface ShelfData {
  isLoading: boolean;
  isError: boolean;
  refetch: () => unknown;
}

/** A Home shelf of item cards backed by a query result. Tapping a card body
 * `onOpen`s its detail page; the play FAB `onPlay`s it. Both receive the item
 * and its index. */
export function CardShelf({
  title,
  items,
  state,
  onOpen,
  onPlay,
  onPrefetch,
  round = false,
  seeAllHref,
  hideWhenEmpty = false,
}: {
  title: string;
  items: JellyfinItem[];
  state: ShelfData;
  onOpen: (item: JellyfinItem, index: number) => void;
  onPlay: (item: JellyfinItem, index: number) => void;
  onPrefetch?: (item: JellyfinItem) => void;
  round?: boolean;
  seeAllHref?: string;
  /** Hide the whole shelf once it has loaded empty (Spotify-style — no bare
   * "nothing here" box on Home). The loading skeleton + error/retry still show. */
  hideWhenEmpty?: boolean;
}) {
  if (hideWhenEmpty && !state.isLoading && !state.isError && items.length === 0) return null;
  return (
    <Shelf
      title={title}
      isLoading={state.isLoading}
      isError={state.isError}
      onRetry={() => void state.refetch()}
      isEmpty={items.length === 0}
      seeAllHref={seeAllHref}
    >
      {items.map((item, index) => (
        <AlbumCard
          key={item.Id}
          item={item}
          onOpen={() => onOpen(item, index)}
          onPlay={() => onPlay(item, index)}
          onPrefetch={onPrefetch}
          round={round}
        />
      ))}
    </Shelf>
  );
}
