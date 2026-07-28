import { IonInput, IonButton } from '@ionic/react';
import { useGrabSettings } from './useGrabSettings';
import './searchBackend.css';

/** Settings "Grab missing tracks" section: point Cadence at a self-hosted Music
 * Grabber service to acquire a single song that isn't in your library yet. Off by
 * default — a blank URL hides the Grab affordance. The API key is stored only on
 * this device; it isn't a strong secret (it ships in the bundle to gate casual
 * access at the proxy), so a password field is courtesy, not real protection. */
export function GrabBackend() {
  const { url, key, saved, onUrl, onKey, save } = useGrabSettings();
  return (
    <section className="settings__search-backend">
      <h2 className="settings__title cad-kicker">Grab missing tracks</h2>
      <p className="search-backend__hint cad-meta">
        Optional: point Cadence at a Music Grabber server so you can grab a single track that isn’t
        in your library yet. Leave blank to hide the feature.
      </p>
      <IonInput
        label="Music Grabber URL"
        labelPlacement="stacked"
        placeholder="https://musicgrabber.example.com"
        value={url}
        onIonInput={(e) => onUrl(e.detail.value ?? '')}
        data-testid="grab-url"
        type="url"
        autocapitalize="off"
      />
      <IonInput
        label="API key"
        labelPlacement="stacked"
        placeholder="Service API key"
        value={key}
        onIonInput={(e) => onKey(e.detail.value ?? '')}
        data-testid="grab-key"
        type="password"
      />
      <IonButton size="small" onClick={save} data-testid="grab-save">
        {saved ? 'Saved' : 'Save'}
      </IonButton>
    </section>
  );
}
