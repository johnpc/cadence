import { useHistory } from 'react-router-dom';
import { usePlayer } from '../player/usePlayer';
import type { RecentItem } from './recentSearchStore';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/**
 * Activate a search result the same way whether it's tapped or reached by
 * pressing Enter in the search box: a song plays; an album/artist/playlist opens
 * its detail page. Records the pick as a recent search first. Shared so the Top
 * Result card and the keyboard path can't drift apart.
 */
export function useActivateResult(onPick: (item: RecentItem) => void) {
  const history = useHistory();
  const { playQueue } = usePlayer();
  return (item: JellyfinItem) => {
    onPick(item);
    if (item.Type === 'MusicAlbum') history.push(`/album/${item.Id}`);
    else if (item.Type === 'MusicArtist') history.push(`/artist/${item.Id}`);
    else if (item.Type === 'Playlist') history.push(`/playlist/${item.Id}`);
    else playQueue([item], 0);
  };
}
