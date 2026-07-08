import { TrackArt } from '../player/TrackArt';
import { artistLine } from '../player/playerFormat';
import type { JellyfinItem } from '../../lib/jellyfinTypes';
import './home.css';

/** A card for a Home shelf. Tapping plays it (via onPlay). `round` renders
 * circular art + centered label — used for artist shelves. */
export function AlbumCard({
  item,
  onPlay,
  round = false,
}: {
  item: JellyfinItem;
  onPlay: (item: JellyfinItem) => void;
  round?: boolean;
}) {
  return (
    <button
      type="button"
      className={round ? 'album-card album-card--round' : 'album-card'}
      data-testid="album-card"
      onClick={() => onPlay(item)}
    >
      <TrackArt item={item} size={140} round={round} />
      <span className="album-card__title">{item.Name}</span>
      {!round && (
        <span className="album-card__artist">{artistLine(item) || item.AlbumArtist || ''}</span>
      )}
    </button>
  );
}
