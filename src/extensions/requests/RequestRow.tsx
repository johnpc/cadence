import { IonButton, IonSpinner } from '@ionic/react';
import type { LidarrArtist } from './lidarrTypes';
import type { RequestStatus } from './useMusicRequests';
import './requests.css';

/** One artist search result with a Request button reflecting its status. The
 * remote poster (from MusicBrainz via Lidarr) shows when present, else nothing —
 * these artists aren't in the library yet, so there's no Jellyfin art. */
export function RequestRow({
  artist,
  status,
  inLibrary = false,
  onRequest,
}: {
  artist: LidarrArtist;
  status: RequestStatus;
  /** Already in the library — show "In library" instead of a Request button. */
  inLibrary?: boolean;
  onRequest: (a: LidarrArtist) => void;
}) {
  return (
    <div className="request-row" data-testid="request-row">
      {artist.remotePoster ? (
        <img className="request-row__art" src={artist.remotePoster} alt="" loading="lazy" />
      ) : (
        <div className="request-row__art request-row__art--empty" aria-hidden="true" />
      )}
      <span className="request-row__name">{artist.artistName}</span>
      {inLibrary ? (
        <span className="request-row__done" data-testid="request-in-library">
          In library
        </span>
      ) : status === 'requested' ? (
        <span className="request-row__done" data-testid="request-done">
          Requested
        </span>
      ) : (
        <IonButton
          size="small"
          fill="outline"
          data-testid="request-button"
          disabled={status === 'requesting'}
          onClick={() => onRequest(artist)}
        >
          {status === 'requesting' ? <IonSpinner name="dots" /> : 'Request'}
        </IonButton>
      )}
    </div>
  );
}
