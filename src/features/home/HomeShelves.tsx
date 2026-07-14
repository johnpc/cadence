import { useHistory } from 'react-router-dom';
import { CardShelf } from './CardShelf';
import { DailyMixShelf } from './DailyMixShelf';
import { SongShelves } from './SongShelves';
import { useHomeShelves } from './useHomeShelves';
export { useHomeShelves } from './useHomeShelves';
import { usePlayItem } from '../player/usePlayItem';
import { usePrefetchItem } from './usePrefetchItem';
import { useIdlePrefetch } from './useIdlePrefetch';
import { detailPath } from './itemPath';

export function HomeShelves({ shelves }: { shelves: ReturnType<typeof useHomeShelves> }) {
  const { albums, saved, recent, artists, jumpBackIn, community } = shelves;
  const playItem = usePlayItem();
  const prefetch = usePrefetchItem();
  const history = useHistory();
  // Idle-warm the most-likely first tap (see useIdlePrefetch).
  useIdlePrefetch(jumpBackIn.items[0] ?? albums.albums[0], prefetch);
  const openAlbum = (item: { Id: string }) => history.push(`/album/${item.Id}`);
  const openArtist = (item: { Id: string }) => history.push(`/artist/${item.Id}`);
  const openPlaylist = (item: { Id: string }) => history.push(`/playlist/${item.Id}`);
  return (
    <div data-testid="home-shelves">
      {jumpBackIn.items.length > 0 && (
        <CardShelf
          title="Jump back in"
          items={jumpBackIn.items}
          state={jumpBackIn}
          onOpen={(item) => history.push(detailPath(item))}
          onPlay={(item) => void playItem(item)}
          onPrefetch={prefetch}
        />
      )}
      <CardShelf
        title="Recently added"
        items={albums.albums}
        state={albums}
        onOpen={openAlbum}
        onPlay={(item) => void playItem(item)}
        onPrefetch={prefetch}
        hideWhenEmpty
      />
      <DailyMixShelf artists={artists.artists} recentTracks={recent.songs} />
      <SongShelves shelves={shelves} />
      {artists.artists.length > 0 && (
        <CardShelf
          title="Your artists"
          items={artists.artists}
          state={artists}
          seeAllHref="/library?filter=artists"
          onOpen={openArtist}
          onPlay={(item) => void playItem(item)}
          onPrefetch={prefetch}
          round
        />
      )}
      {saved.albums.length > 0 && (
        <CardShelf
          title="From your library"
          items={saved.albums}
          state={saved}
          seeAllHref="/library?filter=albums"
          onOpen={openAlbum}
          onPlay={(item) => void playItem(item)}
          onPrefetch={prefetch}
        />
      )}
      {community.playlists.length > 0 && (
        <CardShelf
          title="From the community"
          items={community.playlists}
          state={community}
          onOpen={openPlaylist}
          onPlay={(item) => void playItem(item)}
          onPrefetch={prefetch}
        />
      )}
    </div>
  );
}
