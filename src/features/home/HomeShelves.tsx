import { useHistory } from 'react-router-dom';
import { CardShelf } from './CardShelf';
import { useLatestAlbums, useSuggestedSongs, useRecentlyPlayed } from './homeApi';
import { useSavedAlbums, useFollowedArtists } from '../library/libraryApi';
import { usePlayer } from '../player/usePlayer';

/** The Home recommendation shelves. Grouped here so Home.tsx stays a thin page
 * shell (and the refresher can refetch them all). */
export function useHomeShelves() {
  const albums = useLatestAlbums();
  const suggested = useSuggestedSongs();
  const saved = useSavedAlbums();
  const recent = useRecentlyPlayed();
  const artists = useFollowedArtists();
  return { albums, suggested, saved, recent, artists };
}

export function HomeShelves({ shelves }: { shelves: ReturnType<typeof useHomeShelves> }) {
  const { albums, suggested, saved, recent, artists } = shelves;
  const { playQueue } = usePlayer();
  const history = useHistory();
  const openAlbum = (item: { Id: string }) => history.push(`/album/${item.Id}`);
  const openArtist = (item: { Id: string }) => history.push(`/artist/${item.Id}`);
  return (
    <div data-testid="home-shelves">
      <CardShelf title="Recently added" items={albums.albums} state={albums} onPlay={openAlbum} />
      {recent.songs.length > 0 && (
        <CardShelf
          title="Recently played"
          items={recent.songs}
          state={recent}
          onPlay={(_i, index) => playQueue(recent.songs, index)}
        />
      )}
      {artists.artists.length > 0 && (
        <CardShelf
          title="Your artists"
          items={artists.artists}
          state={artists}
          onPlay={openArtist}
          round
        />
      )}
      {saved.albums.length > 0 && (
        <CardShelf
          title="From your library"
          items={saved.albums}
          state={saved}
          onPlay={openAlbum}
        />
      )}
      <CardShelf
        title="Suggested for you"
        items={suggested.songs}
        state={suggested}
        onPlay={(_i, index) => playQueue(suggested.songs, index)}
      />
    </div>
  );
}
