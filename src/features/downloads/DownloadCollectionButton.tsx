import { IonIcon, IonSpinner } from '@ionic/react';
import { arrowDownCircleOutline, checkmarkCircle, ellipseOutline } from 'ionicons/icons';
import { useDownloadCollection } from './useDownloadCollection';
import type { JellyfinItem } from '../../lib/jellyfinTypes';
import './downloadButton.css';

/** Download (or remove) a whole collection — album, playlist, likes — in one
 * tap. Outline arrow when none/partial, a spinner with a live count while
 * downloading, a filled check once every track is saved (tap then removes all). */
export function DownloadCollectionButton({ tracks }: { tracks: JellyfinItem[] }) {
  const { state, progress, busy, downloadAll, removeAll } = useDownloadCollection(tracks);
  if (tracks.length === 0) return null;
  const downloaded = state === 'downloaded';
  const icon =
    state === 'partial' ? ellipseOutline : downloaded ? checkmarkCircle : arrowDownCircleOutline;
  return (
    <button
      type="button"
      className={downloaded ? 'dl-btn dl-btn--on' : 'dl-btn'}
      style={{ fontSize: 22 }}
      onClick={() => void (downloaded ? removeAll() : downloadAll())}
      disabled={busy}
      data-testid="download-collection"
      data-state={state}
      aria-pressed={downloaded}
      aria-label={downloaded ? 'Remove downloads' : 'Download all for offline'}
    >
      {state === 'downloading' ? (
        <span className="dl-btn__progress">
          <IonSpinner name="crescent" />
          <span className="dl-btn__count" data-testid="download-progress">
            {progress.done}/{progress.total}
          </span>
        </span>
      ) : (
        <IonIcon icon={icon} />
      )}
    </button>
  );
}
