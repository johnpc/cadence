import { Shelf } from './Shelf';
import { AlbumCard } from './AlbumCard';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

interface ShelfData {
  isLoading: boolean;
  isError: boolean;
  refetch: () => unknown;
}

/** A Home shelf of item cards backed by a query result. `onPlay` receives the
 * item and its index (songs play a queue; albums navigate). */
export function CardShelf({
  title,
  items,
  state,
  onPlay,
  round = false,
}: {
  title: string;
  items: JellyfinItem[];
  state: ShelfData;
  onPlay: (item: JellyfinItem, index: number) => void;
  round?: boolean;
}) {
  return (
    <Shelf
      title={title}
      isLoading={state.isLoading}
      isError={state.isError}
      onRetry={() => void state.refetch()}
      isEmpty={items.length === 0}
    >
      {items.map((item, index) => (
        <AlbumCard key={item.Id} item={item} onPlay={() => onPlay(item, index)} round={round} />
      ))}
    </Shelf>
  );
}
