import { useHistory } from 'react-router-dom';
import { usePlayer } from '../player/usePlayer';
import { ResultRow } from './ResultRow';
import type { RecentItem } from './recentSearchStore';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** The Search idle state: recently-tapped results, or a prompt when empty. */
export function RecentSearches({
  recents,
  onClear,
}: {
  recents: RecentItem[];
  onClear: () => void;
}) {
  const history = useHistory();
  const { playQueue } = usePlayer();

  if (recents.length === 0) {
    return (
      <p className="cad-meta" data-testid="search-idle">
        Search your library.
      </p>
    );
  }

  const open = (item: RecentItem) => {
    if (item.Type === 'MusicAlbum') history.push(`/album/${item.Id}`);
    else if (item.Type === 'MusicArtist') history.push(`/artist/${item.Id}`);
    else playQueue([item as JellyfinItem], 0);
  };

  return (
    <div data-testid="recent-searches">
      <div className="search__recent-head">
        <h2 className="cad-kicker search__section">Recent searches</h2>
        <button className="search__clear" data-testid="clear-recents" onClick={onClear}>
          Clear
        </button>
      </div>
      {recents.map((item) => (
        <ResultRow
          key={item.Id}
          item={item as JellyfinItem}
          subtitle={
            item.Type === 'MusicArtist' ? 'Artist' : (item.Artists?.[0] ?? item.AlbumArtist ?? '')
          }
          onSelect={() => open(item)}
        />
      ))}
    </div>
  );
}
