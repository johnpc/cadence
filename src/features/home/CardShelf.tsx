import { Shelf } from './Shelf';
import { AlbumCard } from './AlbumCard';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

interface ShelfData {
  isLoading: boolean;
  isError: boolean;
  refetch: () => unknown;
}

/** A Home shelf of item cards backed by a query result. `onPlay` receives the
 * item and its index (songs play a queue; albums navigate). `onPlayNow`, when
 * given, adds a hover play FAB that plays the item immediately. */
export function CardShelf({
  title,
  items,
  state,
  onPlay,
  onPlayNow,
  round = false,
}: {
  title: string;
  items: JellyfinItem[];
  state: ShelfData;
  onPlay: (item: JellyfinItem, index: number) => void;
  onPlayNow?: (item: JellyfinItem, index: number) => void;
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
        <AlbumCard
          key={item.Id}
          item={item}
          onPlay={() => onPlay(item, index)}
          onPlayNow={onPlayNow ? () => onPlayNow(item, index) : undefined}
          round={round}
        />
      ))}
    </Shelf>
  );
}
