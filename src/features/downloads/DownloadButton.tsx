import { IonIcon, IonSpinner } from '@ionic/react';
import { arrowDownCircleOutline, checkmarkCircle } from 'ionicons/icons';
import { useDownload } from './useDownload';
import type { JellyfinItem } from '../../lib/jellyfinTypes';
import './downloadButton.css';

/** A per-track download toggle: an outline arrow when not saved, a spinner
 * while downloading, and a filled check (accent) once available offline. Tapping
 * a downloaded track removes it. */
export function DownloadButton({ track, size = 22 }: { track: JellyfinItem; size?: number }) {
  const { state, toggle, busy } = useDownload(track);
  const downloaded = state === 'downloaded';
  return (
    <button
      type="button"
      className={downloaded ? 'dl-btn dl-btn--on' : 'dl-btn'}
      style={{ fontSize: size }}
      onClick={(e) => {
        e.stopPropagation();
        toggle();
      }}
      disabled={busy}
      data-testid="download-button"
      data-state={state}
      aria-pressed={downloaded}
      aria-label={downloaded ? 'Remove download' : 'Download for offline'}
    >
      {state === 'downloading' ? (
        <IonSpinner name="crescent" />
      ) : (
        <IonIcon icon={downloaded ? checkmarkCircle : arrowDownCircleOutline} />
      )}
    </button>
  );
}
