import { IonIcon } from '@ionic/react';
import { play } from 'ionicons/icons';
import { TrackArt } from '../player/TrackArt';
import { artistLine } from '../player/playerFormat';
import type { JellyfinItem } from '../../lib/jellyfinTypes';
import './home.css';

/** A card for a Home shelf. The card body fires `onPlay` (navigate or play);
 * when `onPlayNow` is given, a green FAB appears on hover to play immediately
 * without leaving the shelf (Spotify-style). `round` = circular artist card. */
export function AlbumCard({
  item,
  onPlay,
  onPlayNow,
  round = false,
}: {
  item: JellyfinItem;
  onPlay: (item: JellyfinItem) => void;
  onPlayNow?: (item: JellyfinItem) => void;
  round?: boolean;
}) {
  return (
    <div className={round ? 'album-card album-card--round' : 'album-card'} data-testid="album-card">
      <button type="button" className="album-card__hit" onClick={() => onPlay(item)}>
        <TrackArt item={item} size={140} round={round} />
        <span className="album-card__title">{item.Name}</span>
        {!round && (
          <span className="album-card__artist">{artistLine(item) || item.AlbumArtist || ''}</span>
        )}
      </button>
      {onPlayNow && (
        <button
          type="button"
          className="album-card__play"
          data-testid="album-card-play"
          aria-label={`Play ${item.Name}`}
          onClick={() => onPlayNow(item)}
        >
          <IonIcon icon={play} />
        </button>
      )}
    </div>
  );
}
