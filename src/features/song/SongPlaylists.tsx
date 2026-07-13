import { Link } from 'react-router-dom';
import { useSongPlaylists } from './songApi';
import { useInView } from '../../lib/useInView';

/** The "Appears in" playlists for a song. The query is EXPENSIVE (scans up to 40
 * playlists' track lists), so it's deferred until this below-the-fold section
 * scrolls near view (useInView) rather than firing on the song page's mount.
 * Renders a sentinel until then; nothing when the song is in no playlists. */
export function SongPlaylists({ songId }: { songId: string }) {
  const { ref, inView } = useInView();
  const { playlists } = useSongPlaylists(songId, inView);
  if (playlists.length === 0) return <div ref={ref} data-testid="song-playlists-sentinel" />;
  return (
    <section data-testid="song-playlists">
      <h2 className="cad-kicker song__section">Appears in</h2>
      {playlists.map((pl) => (
        <Link key={pl.Id} className="song__playlist" to={`/playlist/${pl.Id}`}>
          {pl.Name}
        </Link>
      ))}
    </section>
  );
}
