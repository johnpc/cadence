import { Link } from 'react-router-dom';
import { LoadState } from '../../components/LoadState';
import { TrackArt } from '../player/TrackArt';
import { usePlaylists } from './playlistsApi';
import { CreatePlaylist } from './CreatePlaylist';
import './playlists.css';

/** The user's playlists, shown in Your Library. Each links to its detail page. */
export function Playlists() {
  const { playlists, isLoading, isError, refetch } = usePlaylists();
  return (
    <section className="playlists">
      <div className="playlists__header">
        <h2 className="cad-headline">Playlists</h2>
        <CreatePlaylist />
      </div>
      <LoadState
        isLoading={isLoading}
        isError={isError}
        onRetry={() => void refetch()}
        isEmpty={playlists.length === 0}
        emptyTitle="No playlists yet"
        emptyMessage="Create one, then add songs from anywhere."
      >
        <div data-testid="playlists">
          {playlists.map((pl) => (
            <Link
              key={pl.Id}
              className="playlists__row"
              to={`/playlist/${pl.Id}`}
              data-testid="playlist-row"
            >
              <TrackArt item={pl} size={48} />
              <span className="playlists__name">{pl.Name}</span>
            </Link>
          ))}
        </div>
      </LoadState>
    </section>
  );
}
