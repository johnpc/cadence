import { IonIcon } from '@ionic/react';
import { downloadOutline } from 'ionicons/icons';
import { useInstallPrompt } from './useInstallPrompt';
import './installButton.css';

/** Settings "Install app" — only shown when the browser offers an install prompt. */
export function InstallButton() {
  const { available, install } = useInstallPrompt();
  if (!available) return null;
  return (
    <section className="install">
      <h2 className="install__title cad-kicker">App</h2>
      <button
        type="button"
        className="install__btn"
        data-testid="install-app"
        onClick={() => void install()}
      >
        <IonIcon icon={downloadOutline} /> Install Cadence
      </button>
    </section>
  );
}
