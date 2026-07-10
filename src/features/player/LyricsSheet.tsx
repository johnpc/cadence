import { IonModal, IonIcon } from '@ionic/react';
import { chevronDown } from 'ionicons/icons';
import { useEffect, useRef } from 'react';
import { LoadState } from '../../components/LoadState';
import { usePlayer } from './usePlayer';
import { usePlayerProgress } from './PlayerProgressContext';
import { useLyrics } from './useLyrics';
import { activeLineIndex, isSynced } from './activeLyric';
import { LyricLineRow } from './LyricLineRow';
import './lyricsSheet.css';

/** A scrollable lyric sheet for the current track. When the track has synced
 * (LRC) timing, the active line is highlighted and auto-scrolled into view
 * (karaoke-style); otherwise it's a plain scrollable sheet. */
export function LyricsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { current, seek } = usePlayer();
  const { position } = usePlayerProgress();
  const { lines, isLoading, isError, refetch } = useLyrics(current?.Id, open);
  const synced = isSynced(lines);
  const active = synced ? activeLineIndex(lines, position) : -1;
  const activeRef = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [active]);

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
          <div
            className={synced ? 'lyrics__body lyrics__body--synced' : 'lyrics__body'}
            data-testid="lyrics-lines"
          >
            {lines.map((line, i) => (
              <LyricLineRow
                key={i}
                line={line}
                active={i === active}
                onSeek={seek}
                ref={i === active ? activeRef : undefined}
              />
            ))}
          </div>
        </LoadState>
      </div>
    </IonModal>
  );
}
