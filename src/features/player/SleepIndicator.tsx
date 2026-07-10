import { IonIcon } from '@ionic/react';
import { moon, close } from 'ionicons/icons';
import { usePlayer } from './usePlayer';
import { sleepLabel } from './sleepLabel';
import './sleepIndicator.css';

/** A small pill shown in the full player while a sleep timer is armed, so it's
 * visible + cancelable where you're listening — not just buried in Settings.
 * Tapping the ✕ disarms it. Renders nothing when the timer is off. */
export function SleepIndicator() {
  const { sleepMode, armSleep } = usePlayer();
  const label = sleepLabel(sleepMode);
  if (!label) return null;
  return (
    <div className="sleep-indicator" data-testid="sleep-indicator">
      <IonIcon icon={moon} aria-hidden="true" />
      <span>{label}</span>
      <button
        type="button"
        className="sleep-indicator__cancel"
        data-testid="sleep-cancel"
        aria-label="Cancel sleep timer"
        onClick={() => armSleep(null)}
      >
        <IonIcon icon={close} />
      </button>
    </div>
  );
}
