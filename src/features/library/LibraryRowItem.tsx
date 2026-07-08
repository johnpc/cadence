import { IonIcon } from '@ionic/react';
import { heart } from 'ionicons/icons';
import { Link } from 'react-router-dom';
import { TrackArt } from '../player/TrackArt';
import type { LibraryRow } from './libraryRows';
import './libraryList.css';

/** One row in the unified library list — art (round for artists, or a heart
 * tile for Liked Songs), name, and a small subtitle. Links to its page. */
export function LibraryRowItem({ row }: { row: LibraryRow }) {
  return (
    <Link className="library-row" to={row.to} data-testid="library-row">
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
