import { IonModal, IonIcon } from '@ionic/react';
import { chevronDown } from 'ionicons/icons';
import { useEffect, useRef } from 'react';
import { LoadState } from '../../components/LoadState';
import { usePlayer } from '../player/usePlayer';
import { usePlayerProgress } from '../player/PlayerProgressContext';
import { useChapters } from './useChapters';
import { chapterIndexAt } from './chapterAt';
import { ChapterRow } from './ChapterRow';
import './chapterSheet.css';

/** A scrollable chapter list for the current audiobook. Tapping a chapter seeks
 * to it; the chapter currently playing is highlighted and auto-scrolled into
 * view. Only meaningful for audiobook items — the trigger that opens it is hidden
 * otherwise (see FullPlayer). */
export function ChapterSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { current, seek } = usePlayer();
  const { position } = usePlayerProgress();
  const { chapters, isLoading } = useChapters(current);
  const active = chapterIndexAt(chapters, position);
  const activeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (open) activeRef.current?.scrollIntoView({ block: 'center' });
  }, [active, open]);

  const seekAndClose = (seconds: number) => {
    seek(seconds);
    onClose();
  };

  return (
    <IonModal isOpen={open} onDidDismiss={onClose}>
      <div className="chapters" data-testid="chapter-sheet">
        <div className="chapters__head">
          <button className="chapters__close" onClick={onClose} aria-label="Close chapters">
            <IonIcon icon={chevronDown} />
          </button>
          <h2 className="cad-headline">Chapters</h2>
        </div>
        <LoadState
          isLoading={isLoading}
          isError={false}
          isEmpty={chapters.length === 0}
          emptyTitle="No chapters"
          emptyMessage="This audiobook has no chapter markers."
        >
          <div className="chapters__body" data-testid="chapter-list">
            {chapters.map((chapter, i) => (
              <ChapterRow
                key={i}
                chapter={chapter}
                index={i}
                active={i === active}
                onSeek={seekAndClose}
                ref={i === active ? activeRef : undefined}
              />
            ))}
          </div>
        </LoadState>
      </div>
    </IonModal>
  );
}
