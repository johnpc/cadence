import { Link } from 'react-router-dom';
import { LoadState } from '../../components/LoadState';
import { TrackArt } from '../player/TrackArt';
import { useFollowedArtists } from './libraryApi';
import './followedArtists.css';

/** The user's followed artists in Your Library. Each links to its detail page. */
export function FollowedArtists() {
  const { artists, isLoading, isError, refetch } = useFollowedArtists();
  return (
    <section className="followed-artists">
      <h2 className="cad-headline">Artists</h2>
      <LoadState
        isLoading={isLoading}
        isError={isError}
        onRetry={() => void refetch()}
        isEmpty={artists.length === 0}
        emptyTitle="No followed artists yet"
        emptyMessage="Tap the + on any artist to follow them."
      >
        <div data-testid="followed-artists">
          {artists.map((artist) => (
            <Link
              key={artist.Id}
              className="followed-artists__row"
              to={`/artist/${artist.Id}`}
              data-testid="followed-artist-row"
            >
              <TrackArt item={artist} size={48} />
              <span className="followed-artists__name">{artist.Name}</span>
            </Link>
          ))}
        </div>
      </LoadState>
    </section>
  );
}
