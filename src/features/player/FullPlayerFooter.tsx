import { IonIcon } from '@ionic/react';
import { listOutline, documentTextOutline } from 'ionicons/icons';
import { NowPlayingMenu } from './NowPlayingMenu';
import { CastButton } from '../cast/CastButton';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** The full player's bottom row: Lyrics, Up next, Cast, and the "…" menu. */
export function FullPlayerFooter({
  current,
  onOpenLyrics,
  onOpenQueue,
  onClose,
}: {
  current: JellyfinItem | null;
  onOpenLyrics: () => void;
  onOpenQueue: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fullplayer__footer">
      <button
        className="fullplayer__foot-btn"
        onClick={onOpenLyrics}
        data-testid="full-player-lyrics"
      >
        <IonIcon icon={documentTextOutline} /> Lyrics
      </button>
      <button
        className="fullplayer__foot-btn"
        onClick={onOpenQueue}
        data-testid="full-player-queue"
      >
        <IonIcon icon={listOutline} /> Up next
      </button>
      <CastButton />
      {current && <NowPlayingMenu track={current} onNavigate={onClose} />}
    </div>
  );
}
