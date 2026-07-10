import { IonIcon } from '@ionic/react';
import { heart } from 'ionicons/icons';
import { Link } from 'react-router-dom';
import { TrackArt } from '../player/TrackArt';
import { usePrefetchItem } from '../home/usePrefetchItem';
import type { LibraryRow } from './libraryRows';
import './libraryList.css';

/** One row in the unified library list — art (round for artists, or a heart
 * tile for Liked Songs), name, and a small subtitle. Links to its page, and
 * warms that page's queries on hover/focus/press so the tap paints instantly
 * (the big lever on "clicking a playlist is slow"). */
export function LibraryRowItem({ row }: { row: LibraryRow }) {
  const prefetch = usePrefetchItem();
  const warm = row.item ? () => prefetch(row.item as NonNullable<typeof row.item>) : undefined;
  return (
    <Link
      className="library-row"
      to={row.to}
      data-testid="library-row"
      onMouseEnter={warm}
      onFocus={warm}
      onPointerDown={warm}
    >
      {row.liked ? (
        <span className="library-row__liked" aria-hidden="true">
          <IonIcon icon={heart} />
        </span>
      ) : (
        <TrackArt item={row.item} size={52} round={row.round} />
      )}
      <span className="library-row__meta">
        <span className="library-row__name">{row.name}</span>
        <span className="library-row__subtitle">{row.subtitle}</span>
      </span>
    </Link>
  );
}
