import { IonIcon } from '@ionic/react';
import { listOutline, documentTextOutline, bookmarksOutline } from 'ionicons/icons';
import { NowPlayingMenu } from './NowPlayingMenu';
import { CastButton } from '../cast/CastButton';
import { isAudiobook } from '../audiobook/isAudiobook';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** The full player's bottom row: Lyrics (or Chapters for an audiobook), Up next,
 * Cast, and the "…" menu. Audiobooks show a Chapters button instead of Lyrics —
 * books have chapter markers, not lyrics. */
export function FullPlayerFooter({
  current,
  onOpenLyrics,
  onOpenChapters,
  onOpenQueue,
  onClose,
}: {
  current: JellyfinItem | null;
  onOpenLyrics: () => void;
  onOpenChapters: () => void;
  onOpenQueue: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fullplayer__footer">
      {isAudiobook(current) ? (
        <button
          className="fullplayer__foot-btn"
          onClick={onOpenChapters}
          data-testid="full-player-chapters"
        >
          <IonIcon icon={bookmarksOutline} /> Chapters
        </button>
      ) : (
        <button
          className="fullplayer__foot-btn"
          onClick={onOpenLyrics}
          data-testid="full-player-lyrics"
        >
          <IonIcon icon={documentTextOutline} /> Lyrics
        </button>
      )}
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
