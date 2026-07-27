import { useHistory } from 'react-router-dom';
import { CardShelf } from './CardShelf';
import { usePlayItem } from '../player/usePlayItem';
import { usePrefetchItem } from './usePrefetchItem';
import type { useHomeShelves } from './useHomeShelves';

/** "Recently played" and "On repeat" — album shelves (Navidrome tracks both
 * at album grain via getAlbumList2, not per-song like Jellyfin's per-user
 * reads). Split out of HomeShelves.tsx to stay under the line limit. */
export function RecentAlbumShelves({ shelves }: { shelves: ReturnType<typeof useHomeShelves> }) {
  const { recent, onRepeat } = shelves;
  const playItem = usePlayItem();
  const prefetch = usePrefetchItem();
  const history = useHistory();
  const openAlbum = (item: { Id: string }) => history.push(`/album/${item.Id}`);
  return (
    <>
      {recent.albums.length > 0 && (
        <CardShelf
          title="Recently played"
          items={recent.albums}
          state={recent}
          seeAllHref="/history"
          onOpen={openAlbum}
          onPlay={(item) => void playItem(item)}
          onPrefetch={prefetch}
        />
      )}
      {onRepeat.albums.length > 0 && (
        <CardShelf
          title="On repeat"
          items={onRepeat.albums}
          state={onRepeat}
          onOpen={openAlbum}
          onPlay={(item) => void playItem(item)}
          onPrefetch={prefetch}
        />
      )}
    </>
  );
}
