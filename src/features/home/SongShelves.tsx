import { useHistory } from 'react-router-dom';
import { CardShelf } from './CardShelf';
import { usePlayer } from '../player/usePlayer';
import type { useHomeShelves } from './useHomeShelves';

type Shelf = { songs: import('../../lib/jellyfinTypes').JellyfinItem[] } & {
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
};

/** The song-list Home shelves (Recently played, On repeat, Suggested) — each
 * opens a song's page on tap and plays the whole shelf from the tapped track via
 * playQueue. Grouped out of HomeShelves so that page stays a thin composition of
 * shelves under the line limit; they all share the same song-shelf shape. */
export function SongShelves({ shelves }: { shelves: ReturnType<typeof useHomeShelves> }) {
  const { recent, onRepeat, suggested } = shelves;
  const { playQueue } = usePlayer();
  const history = useHistory();
  const openSong = (item: { Id: string }) => history.push(`/song/${item.Id}`);
  const songShelf = (title: string, s: Shelf, seeAllHref?: string, hideWhenEmpty?: boolean) => (
    <CardShelf
      title={title}
      items={s.songs}
      state={s}
      seeAllHref={seeAllHref}
      hideWhenEmpty={hideWhenEmpty}
      onOpen={openSong}
      onPlay={(_i, index) => playQueue(s.songs, index)}
    />
  );
  return (
    <>
      {recent.songs.length > 0 && songShelf('Recently played', recent, '/history')}
      {onRepeat.songs.length > 0 && songShelf('On repeat', onRepeat)}
      {songShelf('Suggested for you', suggested, undefined, true)}
    </>
  );
}
