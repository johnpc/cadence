import { IonIcon } from '@ionic/react';
import { closeOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { usePlayer } from '../player/usePlayer';
import { usePrefetchItem } from '../home/usePrefetchItem';
import { ResultRow } from './ResultRow';
import type { RecentItem } from './recentSearchStore';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** The Search idle state: recently-tapped results, or a prompt when empty. */
export function RecentSearches({
  recents,
  onClear,
  onRemove,
}: {
  recents: RecentItem[];
  onClear: () => void;
  onRemove: (id: string) => void;
}) {
  const history = useHistory();
  const { playQueue } = usePlayer();
  const prefetch = usePrefetchItem();

  if (recents.length === 0) {
    return (
      <p className="cad-meta" data-testid="search-idle">
        Search your library.
      </p>
    );
  }

  const open = (item: RecentItem) => {
    // Seed the detail header from the item we hold so it paints instantly.
    prefetch(item as JellyfinItem);
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
        <div className="search__recent-row" key={item.Id}>
          <ResultRow
            item={item as JellyfinItem}
            subtitle={
              item.Type === 'MusicArtist' ? 'Artist' : (item.Artists?.[0] ?? item.AlbumArtist ?? '')
            }
            onSelect={() => open(item)}
          />
          <button
            type="button"
            className="search__recent-remove"
            data-testid="recent-remove"
            aria-label={`Remove ${item.Name} from recent searches`}
            onClick={() => onRemove(item.Id)}
          >
            <IonIcon icon={closeOutline} />
          </button>
        </div>
      ))}
    </div>
  );
}
