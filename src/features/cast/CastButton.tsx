import { IonIcon } from '@ionic/react';
import { tv, tvOutline } from 'ionicons/icons';
import { useCast } from './useCast';
import { usePlayer } from '../player/usePlayer';
import './castButton.css';

/** Cast the current track to a TV. Hidden where casting isn't available (web
 * MVP). When connected it glows and taps stop casting; while the picker or the
 * handshake is in progress it pulses and ignores taps; otherwise it opens the
 * device picker and casts the current track. */
export function CastButton() {
  const { available, status, connected, connecting, deviceName, cast, stop } = useCast();
  const { current } = usePlayer();
  if (!available) return null;
  const className = connected
    ? 'cast-btn cast-btn--on'
    : connecting
      ? 'cast-btn cast-btn--connecting'
      : 'cast-btn';
  const label = connected
    ? `Casting to ${deviceName} — tap to stop`
    : connecting
      ? 'Connecting to a TV…'
      : 'Cast to a TV';
  return (
    <button
      type="button"
      className={className}
      onClick={() => (connected ? stop() : void cast(current))}
      disabled={connecting}
      data-testid="cast-button"
      data-state={status}
      aria-pressed={connected}
      aria-label={label}
    >
      <IonIcon icon={connected ? tv : tvOutline} />
    </button>
  );
}
