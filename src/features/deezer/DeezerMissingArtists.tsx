import { MissingArtistRow } from './MissingArtistRow';
import { useDeezerMissing } from './useDeezerMissing';
import './deezer.css';

/** On a Deezer-imported playlist's page, a persistent list of the artists whose
 * tracks aren't in the library yet — each requestable via Lidarr. The list is
 * fetched from the plugin (recomputed against the current library) so it survives
 * across sessions and shrinks as Lidarr fills artists in. Renders nothing when the
 * playlist isn't a Deezer subscription or nothing is missing. */
export function DeezerMissingArtists({ playlistId }: { playlistId: string }) {
  const { missing, status, request } = useDeezerMissing(playlistId);
  if (missing.length === 0) return null;
  return (
    <div className="deezer-missing" data-testid="deezer-playlist-missing">
      <h2 className="cad-kicker">From Deezer, not in your library yet</h2>
      <p className="cad-meta">
        Request these artists to download their music — they’ll be added to this playlist
        automatically once they arrive.
      </p>
      {missing.map((name) => (
        <MissingArtistRow
          key={name}
          name={name}
          status={status[name] ?? 'idle'}
          onRequest={request}
        />
      ))}
    </div>
  );
}
