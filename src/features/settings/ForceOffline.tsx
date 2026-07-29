import { IonToggle } from '@ionic/react';
import { useForceOffline } from './useForceOffline';
import './autoplay.css';

/** Settings "Offline mode" control — when on, Cadence stops all network calls
 * and shows only your downloaded content (the iPod-style offline library), even
 * if your server is reachable. Off returns to streaming from Jellyfin. */
export function ForceOffline() {
  const { forceOffline, setForceOffline } = useForceOffline();
  return (
    <section className="autoplay">
      <div className="autoplay__row">
        <div className="autoplay__text">
          <h2 className="autoplay__title cad-kicker">Offline mode</h2>
          <p className="cad-meta">
            Play only downloaded content, with no connection to your server.
          </p>
        </div>
        <IonToggle
          checked={forceOffline}
          onIonChange={(e) => setForceOffline(e.detail.checked)}
          aria-label="Offline mode"
          data-testid="force-offline-toggle"
        />
      </div>
    </section>
  );
}
