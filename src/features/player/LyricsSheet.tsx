import { IonModal, IonIcon } from '@ionic/react';
import { chevronDown } from 'ionicons/icons';
import { LoadState } from '../../components/LoadState';
import { usePlayer } from './usePlayer';
import { useLyrics } from './useLyrics';
import './lyricsSheet.css';

/** A scrollable lyric sheet for the current track (Jellyfin lyrics). */
export function LyricsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { current } = usePlayer();
  const { lines, isLoading, isError, refetch } = useLyrics(current?.Id, open);

  return (
    <IonModal isOpen={open} onDidDismiss={onClose}>
      <div className="lyrics" data-testid="lyrics-sheet">
        <div className="lyrics__head">
          <button className="lyrics__close" onClick={onClose} aria-label="Close lyrics">
            <IonIcon icon={chevronDown} />
          </button>
          <h2 className="cad-headline">{current?.Name}</h2>
        </div>
        <LoadState
          isLoading={isLoading}
          isError={isError}
          onRetry={() => void refetch()}
          isEmpty={lines.length === 0}
          emptyTitle="No lyrics"
          emptyMessage="This track has no lyrics on your server."
        >
          <div className="lyrics__body" data-testid="lyrics-lines">
            {lines.map((line, i) => (
              <p key={i} className="lyrics__line">
                {line || ' '}
              </p>
            ))}
          </div>
        </LoadState>
      </div>
    </IonModal>
  );
}
