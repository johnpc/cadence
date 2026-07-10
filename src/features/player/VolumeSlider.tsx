import { IonIcon } from '@ionic/react';
import { volumeLow, volumeHigh } from 'ionicons/icons';
import { hasSoftwareVolume } from '../../lib/platform';

/** The FullPlayer's volume slider. Renders nothing on iOS, where
 * HTMLMediaElement.volume is read-only (hardware volume only) so a slider can't
 * do anything — showing a dead control would just confuse. */
export function VolumeSlider({
  volume,
  setVolume,
}: {
  volume: number;
  setVolume: (v: number) => void;
}) {
  if (!hasSoftwareVolume()) return null;
  return (
    <div className="fullplayer__volume">
      <IonIcon icon={volumeLow} aria-hidden="true" />
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={volume}
        onChange={(e) => setVolume(Number(e.target.value))}
        aria-label="Volume"
        aria-valuetext={`${Math.round(volume * 100)}%`}
        data-testid="full-player-volume"
      />
      <IonIcon icon={volumeHigh} aria-hidden="true" />
    </div>
  );
}
