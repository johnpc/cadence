import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { LoadState } from '../../components/LoadState';
import { ShelfSkeleton } from '../../components/Skeleton';
import './home.css';

/** A titled horizontal-scrolling shelf of cards, with its own load handling.
 * `seeAllHref`, when given, adds a "Show all" link beside the title. */
export function Shelf({
  title,
  isLoading,
  isError,
  onRetry,
  isEmpty,
  seeAllHref,
  children,
}: {
  title: string;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  isEmpty: boolean;
  seeAllHref?: string;
  children: ReactNode;
}) {
  return (
    <section className="shelf" data-testid="shelf">
      <div className="shelf__head">
        <h2 className="shelf__title cad-headline">{title}</h2>
        {seeAllHref && (
          <Link className="shelf__see-all" to={seeAllHref} data-testid="shelf-see-all">
            Show all
          </Link>
        )}
      </div>
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
