import { IonIcon } from '@ionic/react';
import { tv, tvOutline } from 'ionicons/icons';
import { useCast } from './useCast';
import { usePlayer } from '../player/usePlayer';
import './castButton.css';

/** Cast the current track to a TV. Hidden where casting isn't available (web
 * MVP). When connected it glows and taps stop casting; otherwise it opens the
 * device picker and casts the current track. */
export function CastButton() {
  const { available, connected, deviceName, cast, stop } = useCast();
  const { current } = usePlayer();
  if (!available) return null;
  return (
    <button
      type="button"
      className={connected ? 'cast-btn cast-btn--on' : 'cast-btn'}
      onClick={() => (connected ? stop() : void cast(current))}
      data-testid="cast-button"
      aria-pressed={connected}
      aria-label={connected ? `Casting to ${deviceName} — tap to stop` : 'Cast to a TV'}
    >
      <IonIcon icon={connected ? tv : tvOutline} />
    </button>
  );
}
