import { IonModal, IonIcon } from '@ionic/react';
import { close } from 'ionicons/icons';
import { SHORTCUTS } from './shortcutList';
import './keyboardShortcutsHelp.css';

/** The "?"-triggered overlay listing every keyboard shortcut, Spotify-style.
 * Purely presentational; open state + the "?" hotkey live in useHelpHotkey. */
export function KeyboardShortcutsHelp({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <IonModal isOpen={open} onDidDismiss={onClose} className="kbd-help">
      <div className="kbd-help__panel" data-testid="shortcuts-help">
        <div className="kbd-help__head">
          <h2 className="cad-headline">Keyboard shortcuts</h2>
          <button className="kbd-help__close" onClick={onClose} aria-label="Close shortcuts">
            <IonIcon icon={close} />
          </button>
        </div>
        <dl className="kbd-help__list">
          {SHORTCUTS.map((s) => (
            <div key={s.label} className="kbd-help__row" data-testid="shortcut-row">
              <dd className="kbd-help__keys">
                {s.keys.map((k) => (
                  <kbd key={k} className="kbd-help__key">
                    {k}
                  </kbd>
                ))}
              </dd>
              <dt className="kbd-help__label">{s.label}</dt>
            </div>
          ))}
        </dl>
      </div>
    </IonModal>
  );
}
