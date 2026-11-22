import { IonModal, IonIcon } from '@ionic/react';
import { chevronDown, locateOutline } from 'ionicons/icons';
import { LoadState } from '../../components/LoadState';
import { unavailableCopy, type ReadAlongUnavailableReason } from './readAlongState';
import { useReadAlongSheet } from './useReadAlongSheet';
import { ReadAlongText } from './ReadAlongText';
import { ReadAlongTransport } from './ReadAlongTransport';
import './readAlongSheet.css';

/**
 * Karaoke-style read-along for the playing audiobook: the chapter text with the
 * sentence being narrated highlighted and kept in view; tap a sentence to jump
 * the audio there. Text + timing come from the Storyteller bridge in the
 * CadenceConfig plugin; the audio stays Cadence's own player. Render-only —
 * every decision lives in useReadAlongSheet.
 */
export function ReadAlongSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useReadAlongSheet(open);
  return (
    <IonModal isOpen={open} onDidDismiss={onClose}>
      <div className="readalong" data-testid="readalong-sheet">
        <div className="readalong__head">
          <button className="readalong__close" onClick={onClose} aria-label="Close read along">
            <IonIcon icon={chevronDown} />
          </button>
          <div className="readalong__titles">
            <h2 className="cad-headline">{s.title}</h2>
            {s.chapterTitle && (
              <p className="cad-meta" data-testid="readalong-chapter">
                {s.chapterTitle}
              </p>
            )}
          </div>
        </div>
        {s.state.kind === 'unavailable' ? (
          <Unavailable reason={s.state.reason} />
        ) : (
          <LoadState
            isLoading={s.isLoading}
            isError={s.isError}
            onRetry={s.retry}
            isEmpty={s.html === ''}
            emptyTitle="No text yet"
            emptyMessage="This chapter has no text to show."
          >
            <ReadAlongText
              html={s.html}
              activeFragment={s.activeFragment}
              follow={s.follow}
              onTapFragment={s.onTapFragment}
              onReaderScroll={() => s.setFollow('detached')}
            />
            {s.follow === 'detached' && (
              <button
                className="readalong__follow"
                onClick={() => s.setFollow('following')}
                data-testid="readalong-follow"
              >
                <IonIcon icon={locateOutline} /> Jump to now
              </button>
            )}
            <ReadAlongTransport {...s.transport} />
          </LoadState>
        )}
      </div>
    </IonModal>
  );
}

/** Why read-along can't run right now, in the user's words. Nothing here is the
 * listener's to fix: Storyteller accounts are the server maintainer's job, so the
 * copy says who to ask rather than offering a setting. */
function Unavailable({ reason }: { reason: ReadAlongUnavailableReason }) {
  const copy = unavailableCopy(reason);
  return (
    <div
      className="readalong__unavailable"
      data-testid="readalong-unavailable"
      data-reason={reason}
    >
      <p className="cad-headline-sm">{copy.title}</p>
      <p className="cad-meta">{copy.message}</p>
    </div>
  );
}
