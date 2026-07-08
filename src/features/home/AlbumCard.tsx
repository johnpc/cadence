import { TrackArt } from '../player/TrackArt';
import { artistLine } from '../player/playerFormat';
import type { JellyfinItem } from '../../lib/jellyfinTypes';
import './home.css';

/** A square album/track card for a Home shelf. Tapping plays it (via onPlay). */
export function AlbumCard({
  item,
  onPlay,
}: {
  item: JellyfinItem;
  onPlay: (item: JellyfinItem) => void;
}) {
  return (
    <button
      type="button"
      className="album-card"
      data-testid="album-card"
      onClick={() => onPlay(item)}
    >
      <TrackArt item={item} size={140} />
      <span className="album-card__title">{item.Name}</span>
      <span className="album-card__artist">{artistLine(item) || item.AlbumArtist || ''}</span>
    </button>
  );
}
