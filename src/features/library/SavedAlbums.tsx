import { Link } from 'react-router-dom';
import { LoadState } from '../../components/LoadState';
import { TrackArt } from '../player/TrackArt';
import { artistLine } from '../player/playerFormat';
import { useSavedAlbums } from './libraryApi';
import './savedAlbums.css';

/** The user's saved albums in Your Library. Each links to its detail page. */
export function SavedAlbums() {
  const { albums, isLoading, isError, refetch } = useSavedAlbums();
  return (
    <section className="saved-albums">
      <h2 className="cad-headline">Albums</h2>
      <LoadState
        isLoading={isLoading}
        isError={isError}
        onRetry={() => void refetch()}
        isEmpty={albums.length === 0}
        emptyTitle="No saved albums yet"
        emptyMessage="Tap the + on any album to save it here."
      >
        <div data-testid="saved-albums">
          {albums.map((album) => (
            <Link
              key={album.Id}
              className="saved-albums__row"
              to={`/album/${album.Id}`}
              data-testid="saved-album-row"
            >
              <TrackArt item={album} size={48} />
              <span className="saved-albums__meta">
                <span className="saved-albums__name">{album.Name}</span>
                <span className="saved-albums__artist">
                  {artistLine(album) || album.AlbumArtist || ''}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </LoadState>
    </section>
  );
}
