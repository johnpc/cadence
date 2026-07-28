import { TrackRow } from '../player/TrackRow';
import type { RecentItem } from './recentSearchStore';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** A titled section of playable rows (Songs / Audiobooks) in search results.
 * Renders nothing when hidden by the filter or empty — pulling this out keeps
 * SearchResults' complexity down (two structurally identical sections). */
export function TrackSection({
  show,
  title,
  testId,
  items,
  onPick,
}: {
  show: boolean;
  title: string;
  testId?: string;
  items: JellyfinItem[];
  onPick: (item: RecentItem) => void;
}) {
  if (!show || items.length === 0) return null;
  return (
    <section data-testid={testId}>
      <h2 className="cad-kicker search__section">{title}</h2>
      {items.map((t, i) => (
        <TrackRow key={t.Id} track={t} queue={items} index={i} onPlay={() => onPick(t)} />
      ))}
    </section>
  );
}
