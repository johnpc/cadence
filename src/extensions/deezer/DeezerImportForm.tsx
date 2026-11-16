import { useState } from 'react';
import { IonButton, IonInput, IonSpinner } from '@ionic/react';
import { isValidDeezerPlaylist } from './deezerUrl';
import './deezer.css';

/** How to move a Spotify playlist to Deezer, since Spotify's own API can't be
 * read by third-party apps. A free converter that maps Spotify → Deezer. */
const SPOTIFY_HOWTO_URL = 'https://www.tunemymusic.com/transfer/spotify-to-deezer';

/** The paste-a-Deezer-playlist form: a URL field, an Import button enabled only
 * for a valid playlist reference, and a link explaining how to get a Spotify
 * playlist onto Deezer first (Spotify itself can't be imported directly). */
export function DeezerImportForm({
  importing,
  onImport,
}: {
  importing: boolean;
  onImport: (raw: string) => void;
}) {
  const [value, setValue] = useState('');
  const valid = isValidDeezerPlaylist(value);
  return (
    <div className="deezer-form">
      <IonInput
        className="deezer-form__input"
        value={value}
        placeholder="Paste a public Deezer playlist link"
        onIonInput={(e) => setValue(e.detail.value ?? '')}
        data-testid="deezer-url"
        aria-label="Deezer playlist link"
      />
      <IonButton
        expand="block"
        disabled={!valid || importing}
        onClick={() => onImport(value)}
        data-testid="deezer-import"
      >
        {importing ? <IonSpinner name="dots" /> : 'Import'}
      </IonButton>
      <p className="cad-meta deezer-form__hint">
        Have a Spotify playlist? Spotify can’t be imported directly, but you can{' '}
        <a
          href={SPOTIFY_HOWTO_URL}
          target="_blank"
          rel="noreferrer"
          data-testid="deezer-spotify-help"
        >
          copy it to Deezer for free
        </a>{' '}
        first, then paste the Deezer link here.
      </p>
    </div>
  );
}
