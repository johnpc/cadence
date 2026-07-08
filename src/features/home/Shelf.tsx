import type { ReactNode } from 'react';
import { LoadState } from '../../components/LoadState';
import { ShelfSkeleton } from '../../components/Skeleton';
import './home.css';

/** A titled horizontal-scrolling shelf of cards, with its own load handling. */
export function Shelf({
  title,
  isLoading,
  isError,
  onRetry,
  isEmpty,
  children,
}: {
  title: string;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  isEmpty: boolean;
  children: ReactNode;
}) {
  return (
    <section className="shelf" data-testid="shelf">
      <h2 className="shelf__title cad-headline">{title}</h2>
      <LoadState
        isLoading={isLoading}
        isError={isError}
        onRetry={onRetry}
        isEmpty={isEmpty}
        emptyTitle="Nothing here yet"
        skeleton={<ShelfSkeleton />}
      >
        <div className="shelf__row">{children}</div>
      </LoadState>
    </section>
  );
}
