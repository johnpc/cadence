import { IonModal, IonIcon } from '@ionic/react';
import { chevronDown } from 'ionicons/icons';
import { useEffect } from 'react';
import { LoadState } from '../../components/LoadState';
import { GrabResultRow } from './GrabResultRow';
import { useGrabSearch } from './useGrabSearch';
import { useGrabDownload } from './useGrabDownload';
import './grab.css';

/** The "Grab a track" sheet: searches Music Grabber for the query, lists ranked
 * results, and grabs the chosen one (download + job poll, with toasts). Opened
 * from the empty-search affordance. Runs the search when it opens. */
export function GrabSheet({
  query,
  open,
  onClose,
}: {
  query: string;
  open: boolean;
  onClose: () => void;
}) {
  const { results, token, loading, error, searched, run } = useGrabSearch();
  const { busyId, grab } = useGrabDownload();

  useEffect(() => {
    if (open && query.trim()) void run(query);
    // Re-run only when the sheet opens or the query changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, query]);

  return (
    <IonModal isOpen={open} onDidDismiss={onClose}>
      <div className="grab" data-testid="grab-sheet">
        <div className="grab__head">
          <button className="grab__close" onClick={onClose} aria-label="Close">
            <IonIcon icon={chevronDown} />
          </button>
          <h2 className="cad-headline">Grab “{query.trim()}”</h2>
        </div>
        <LoadState
          isLoading={loading}
          isError={error}
          onRetry={() => void run(query)}
          isEmpty={searched && !loading && results.length === 0}
          emptyTitle="Nothing found"
          emptyMessage="No grabbable sources for that search."
        >
          <div className="grab__list" data-testid="grab-results">
            {results.map((r) => (
              <GrabResultRow
                key={r.video_id}
                result={r}
                busy={busyId === r.video_id}
                disabled={busyId !== null}
                onGrab={() => void grab(r, token)}
              />
            ))}
          </div>
        </LoadState>
      </div>
    </IonModal>
  );
}
