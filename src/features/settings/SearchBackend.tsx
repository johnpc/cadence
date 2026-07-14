import { IonInput, IonButton } from '@ionic/react';
import { useMarlinSettings } from './useMarlinSettings';
import './searchBackend.css';

/** Settings "Faster search" section: optionally point search at a Meilisearch
 * (marlin-search) indexer for one-call, better-ranked results. Off by default —
 * leaving the URL blank keeps Jellyfin's native search. The token is stored only
 * on this device (never shipped in the build). */
export function SearchBackend() {
  const { url, token, saved, managed, onUrl, onToken, save } = useMarlinSettings();
  return (
    <section className="settings__search-backend">
      <h2 className="settings__title cad-kicker">Faster search</h2>
      <p className="search-backend__hint cad-meta">
        {managed
          ? 'Your server administrator has configured search for everyone on this server, so these settings can’t be changed here.'
          : 'Optional: point search at a Meilisearch (marlin-search) server for faster, better-ranked results. Leave blank to use your Jellyfin server’s search.'}
      </p>
      <IonInput
        label="Search server URL"
        labelPlacement="stacked"
        placeholder="https://search.example.com"
        value={url}
        onIonInput={(e) => onUrl(e.detail.value ?? '')}
        data-testid="marlin-url"
        type="url"
        autocapitalize="off"
        disabled={managed}
      />
      {!managed && (
        <IonInput
          label="Search server token"
          labelPlacement="stacked"
          placeholder="Auth token (optional)"
          value={token}
          onIonInput={(e) => onToken(e.detail.value ?? '')}
          data-testid="marlin-token"
          type="password"
        />
      )}
      {managed ? (
        <p className="search-backend__managed cad-meta" data-testid="marlin-managed-note">
          Set by the server administrator
        </p>
      ) : (
        <IonButton size="small" onClick={save} data-testid="marlin-save">
          {saved ? 'Saved' : 'Save'}
        </IonButton>
      )}
    </section>
  );
}
