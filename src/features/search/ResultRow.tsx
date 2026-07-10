import { TrackArt } from '../player/TrackArt';
import type { JellyfinItem } from '../../lib/jellyfinTypes';
import './resultRow.css';

/** A non-track search result (album or artist). Tapping is wired by the parent
 * (e.g. play an instant mix) via onSelect. */
export function ResultRow({
  item,
  subtitle,
  onSelect,
}: {
  item: JellyfinItem;
  subtitle: string;
  onSelect: (item: JellyfinItem) => void;
}) {
  return (
    <button
      type="button"
      className="result-row"
      data-testid="result-row"
      onClick={() => onSelect(item)}
      aria-label={item.Name}
    >
      <TrackArt item={item} size={44} round={item.Type === 'MusicArtist'} />
      <span className="result-row__meta">
        <span className="result-row__title">{item.Name}</span>
        <span className="result-row__subtitle">{subtitle}</span>
      </span>
    </button>
  );
}
