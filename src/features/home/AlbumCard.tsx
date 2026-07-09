import { IonIcon } from '@ionic/react';
import { play } from 'ionicons/icons';
import { TrackArt } from '../player/TrackArt';
import { artistLine } from '../player/playerFormat';
import type { JellyfinItem } from '../../lib/jellyfinTypes';
import './home.css';

/** A card for a Home shelf. Tapping the card body `onOpen`s the item's detail
 * page; the green play FAB `onPlay`s it immediately without leaving the shelf
 * (Spotify-style). `round` = circular artist card. */
export function AlbumCard({
  item,
  onOpen,
  onPlay,
  round = false,
}: {
  item: JellyfinItem;
  onOpen: (item: JellyfinItem) => void;
  onPlay: (item: JellyfinItem) => void;
  round?: boolean;
}) {
  return (
    <div className={round ? 'album-card album-card--round' : 'album-card'} data-testid="album-card">
      <button
        type="button"
        className="album-card__hit"
        data-testid="album-card-open"
        onClick={() => onOpen(item)}
      >
        <TrackArt item={item} size={140} round={round} />
        <span className="album-card__title">{item.Name}</span>
        {!round && (
          <span className="album-card__artist">{artistLine(item) || item.AlbumArtist || ''}</span>
        )}
      </button>
      <button
        type="button"
        className="album-card__play"
        data-testid="album-card-play"
        aria-label={`Play ${item.Name}`}
        onClick={() => onPlay(item)}
      >
        <IonIcon icon={play} />
      </button>
    </div>
  );
}
