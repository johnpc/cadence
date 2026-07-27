import { useHistory } from 'react-router-dom';
import { CardShelf } from './CardShelf';
import { usePlayer } from '../player/usePlayer';
import type { useHomeShelves } from './useHomeShelves';

/** The song-list Home shelves ("Suggested for you" — the only remaining
 * song-grained shelf; "Recently played"/"On repeat" moved to album shelves
 * in HomeShelves.tsx, since Navidrome tracks those at album grain) — opens a
 * song's page on tap and plays the whole shelf from the tapped track via
 * playQueue. Kept in its own file so HomeShelves.tsx stays a thin composition
 * of shelves under the line limit. */
export function SongShelves({ shelves }: { shelves: ReturnType<typeof useHomeShelves> }) {
  const { suggested } = shelves;
  const { playQueue } = usePlayer();
  const history = useHistory();
  const openSong = (item: { Id: string }) => history.push(`/song/${item.Id}`);
  return (
    <CardShelf
      title="Suggested for you"
      items={suggested.songs}
      state={suggested}
      hideWhenEmpty
      onOpen={openSong}
      onPlay={(_i, index) => playQueue(suggested.songs, index)}
    />
  );
}
