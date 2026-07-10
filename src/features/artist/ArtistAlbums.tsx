import { useHistory } from 'react-router-dom';
import { LoadState } from '../../components/LoadState';
import { CardGridSkeleton } from '../../components/Skeleton';
import { TrackArt } from '../player/TrackArt';
import { groupDiscography } from './albumType';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** The artist's discography, split Spotify-style into Albums → Singles & EPs →
 * Compilations (empty sections omitted). The first section keeps the
 * `artist-albums` testid so existing e2e/assertions still find the grid. */
export function ArtistAlbums({
  albums,
  isLoading,
  isError,
  onRetry,
}: {
  albums: JellyfinItem[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  const history = useHistory();
  const groups = groupDiscography(albums);
  return (
    <LoadState
      isLoading={isLoading}
      isError={isError}
      onRetry={onRetry}
      isEmpty={albums.length === 0}
      emptyTitle="No albums"
      emptyMessage="This artist has no albums on your server."
      skeleton={<CardGridSkeleton />}
    >
      {groups.map((group, i) => (
        <section key={group.section}>
          <h2 className="cad-kicker artist__section">{group.title}</h2>
          <div
            className="artist__albums"
            data-testid={i === 0 ? 'artist-albums' : `artist-albums-${group.section}`}
          >
            {group.albums.map((album) => (
              <button
                key={album.Id}
                type="button"
                className="artist__album"
                data-testid="artist-album"
                onClick={() => history.push(`/album/${album.Id}`)}
                aria-label={`Open ${album.Name}`}
              >
                <TrackArt item={album} size={150} />
                <span className="artist__album-name">{album.Name}</span>
                {album.ProductionYear && (
                  <span className="artist__album-year cad-meta">{album.ProductionYear}</span>
                )}
              </button>
            ))}
          </div>
        </section>
      ))}
    </LoadState>
  );
}
