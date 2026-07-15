import { IonButton, IonSpinner } from '@ionic/react';
import type { MissingStatus } from './deezerTypes';
import './deezer.css';

/** One artist from the imported Deezer playlist that isn't in the library yet,
 * with a Request button (via Lidarr) reflecting its status. Deezer gives us only
 * the name, so there's no art — the Request resolves the name to MusicBrainz. */
export function MissingArtistRow({
  name,
  status,
  onRequest,
}: {
  name: string;
  status: MissingStatus;
  onRequest: (name: string) => void;
}) {
  return (
    <div className="deezer-missing__row" data-testid="deezer-missing-row">
      <span className="deezer-missing__name">{name}</span>
      {status === 'requested' ? (
        <span className="deezer-missing__done" data-testid="deezer-missing-done">
          Requested
        </span>
      ) : (
        <IonButton
          size="small"
          fill="outline"
          data-testid="deezer-missing-request"
          disabled={status === 'requesting'}
          onClick={() => onRequest(name)}
        >
          {status === 'requesting' ? <IonSpinner name="dots" /> : 'Request'}
        </IonButton>
      )}
    </div>
  );
}
