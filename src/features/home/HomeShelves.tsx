import { useHistory } from 'react-router-dom';
import { CardShelf } from './CardShelf';
import { DailyMixShelf } from './DailyMixShelf';
import { useHomeShelves } from './useHomeShelves';
export { useHomeShelves } from './useHomeShelves';
import { usePlayer } from '../player/usePlayer';
import { usePlayItem } from '../player/usePlayItem';
import { usePrefetchItem } from './usePrefetchItem';
import { detailPath } from './itemPath';

export function HomeShelves({ shelves }: { shelves: ReturnType<typeof useHomeShelves> }) {
  const { albums, suggested, saved, recent, artists, jumpBackIn, community } = shelves;
  const { playQueue } = usePlayer();
  const playItem = usePlayItem();
  const prefetch = usePrefetchItem();
  const history = useHistory();
  const openAlbum = (item: { Id: string }) => history.push(`/album/${item.Id}`);
  const openArtist = (item: { Id: string }) => history.push(`/artist/${item.Id}`);
  const openSong = (item: { Id: string }) => history.push(`/song/${item.Id}`);
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
      />
      <DailyMixShelf artists={artists.artists} />
      {recent.songs.length > 0 && (
        <CardShelf
          title="Recently played"
          items={recent.songs}
          state={recent}
          seeAllHref="/history"
          onOpen={openSong}
          onPlay={(_i, index) => playQueue(recent.songs, index)}
        />
      )}
      {artists.artists.length > 0 && (
        <CardShelf
          title="Your artists"
          items={artists.artists}
          state={artists}
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
          onOpen={openAlbum}
          onPlay={(item) => void playItem(item)}
          onPrefetch={prefetch}
        />
      )}
      <CardShelf
        title="Suggested for you"
        items={suggested.songs}
        state={suggested}
        onOpen={openSong}
        onPlay={(_i, index) => playQueue(suggested.songs, index)}
      />
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
