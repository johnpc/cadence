import { useHistory } from 'react-router-dom';
import { Shelf } from './Shelf';
import { AlbumCard } from './AlbumCard';
import { useLatestAlbums, useSuggestedSongs } from './homeApi';
import { useSavedAlbums } from '../library/libraryApi';
import { usePlayer } from '../player/usePlayer';

/** The Home recommendation shelves. Grouped here so Home.tsx stays a thin page
 * shell (and the refresher can refetch them all). */
export function useHomeShelves() {
  const albums = useLatestAlbums();
  const suggested = useSuggestedSongs();
  const saved = useSavedAlbums();
  return { albums, suggested, saved };
}

export function HomeShelves({ shelves }: { shelves: ReturnType<typeof useHomeShelves> }) {
  const { albums, suggested, saved } = shelves;
  const { playQueue } = usePlayer();
  const history = useHistory();
  return (
    <div data-testid="home-shelves">
      <Shelf
        title="Recently added"
        isLoading={albums.isLoading}
        isError={albums.isError}
        onRetry={() => void albums.refetch()}
        isEmpty={albums.albums.length === 0}
      >
        {albums.albums.map((album) => (
          <AlbumCard
            key={album.Id}
            item={album}
            onPlay={() => history.push(`/album/${album.Id}`)}
          />
        ))}
      </Shelf>
      {saved.albums.length > 0 && (
        <Shelf
          title="From your library"
          isLoading={saved.isLoading}
          isError={saved.isError}
          onRetry={() => void saved.refetch()}
          isEmpty={saved.albums.length === 0}
        >
          {saved.albums.map((album) => (
            <AlbumCard
              key={album.Id}
              item={album}
              onPlay={() => history.push(`/album/${album.Id}`)}
            />
          ))}
        </Shelf>
      )}
      <Shelf
        title="Suggested for you"
        isLoading={suggested.isLoading}
        isError={suggested.isError}
        onRetry={() => void suggested.refetch()}
        isEmpty={suggested.songs.length === 0}
      >
        {suggested.songs.map((song, index) => (
          <AlbumCard key={song.Id} item={song} onPlay={() => playQueue(suggested.songs, index)} />
        ))}
      </Shelf>
    </div>
  );
}
