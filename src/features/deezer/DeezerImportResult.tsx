import { IonButton } from '@ionic/react';
import { MissingArtistRow } from './MissingArtistRow';
import type { DeezerImportResult as Result, MissingStatus } from './deezerTypes';
import './deezer.css';

/** The outcome of a Deezer import: how many tracks landed, a link into the new
 * playlist, and the artists we couldn't match — each requestable via Lidarr so
 * the user can fill the gaps and re-import later to complete the playlist. */
export function DeezerImportResult({
  result,
  status,
  onRequest,
}: {
  result: Result;
  status: Record<string, MissingStatus>;
  onRequest: (name: string) => void;
}) {
  return (
    <div data-testid="deezer-result">
      <p className="cad-meta">
        Added <strong>{result.AddedCount}</strong> of {result.TotalCount} tracks to{' '}
        <strong>{result.PlaylistName}</strong>.
      </p>
      <IonButton
        expand="block"
        fill="outline"
        routerLink={`/playlist/${result.PlaylistId}`}
        data-testid="deezer-open-playlist"
      >
        Open playlist
      </IonButton>

      {result.MissingArtists.length > 0 && (
        <div className="deezer-missing" data-testid="deezer-missing">
          <h2 className="cad-kicker">Not in your library yet</h2>
          <p className="cad-meta">
            Request these artists to download their music — re-import afterwards to complete the
            playlist.
          </p>
          {result.MissingArtists.map((name) => (
            <MissingArtistRow
              key={name}
              name={name}
              status={status[name] ?? 'idle'}
              onRequest={onRequest}
            />
          ))}
        </div>
      )}
    </div>
  );
}
