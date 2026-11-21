import { IonIcon } from '@ionic/react';
import { listOutline, documentTextOutline, bookmarksOutline, bookOutline } from 'ionicons/icons';
import { NowPlayingMenu } from './NowPlayingMenu';
import { CastButton } from '../cast/CastButton';
import { isAudiobook } from '../audiobook/isAudiobook';
import { storytellerEnabled } from '../../lib/runtimeConfig';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** The full player's bottom row: Lyrics (or Chapters for an audiobook), Up next,
 * Cast, and the "…" menu. Audiobooks show a Chapters button instead of Lyrics —
 * books have chapter markers, not lyrics — plus "Read along" when the server
 * bridges to Storyteller. */
export function FullPlayerFooter({
  current,
  onOpenLyrics,
  onOpenChapters,
  onOpenReadAlong,
  onOpenQueue,
  onClose,
}: {
  current: JellyfinItem | null;
  onOpenLyrics: () => void;
  onOpenChapters: () => void;
  onOpenReadAlong: () => void;
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
      {isAudiobook(current) && storytellerEnabled() && (
        <button
          className="fullplayer__foot-btn"
          onClick={onOpenReadAlong}
          data-testid="full-player-readalong"
        >
          <IonIcon icon={bookOutline} /> Read along
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
