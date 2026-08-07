import { RATE_MIN, RATE_MAX, RATE_STEP } from '../player/usePlaybackRate';
import { usePlayer } from '../player/usePlayer';
import { isAudiobook } from './isAudiobook';
import './speedSlider.css';

/** Playback-speed slider for the audiobook player: 0.5×–3× in 0.25 steps, with a
 * live "1.5×" readout. Books only — spoken-word listeners want fine speed
 * control; music users don't, so it renders nothing for a non-audiobook track. */
export function SpeedSlider() {
  const { current, rate, setRate } = usePlayer();
  if (!isAudiobook(current)) return null;
  return (
    <div className="speed-slider" data-testid="speed-slider">
      <label className="speed-slider__label cad-meta" htmlFor="speed-range">
        Speed
      </label>
      <input
        id="speed-range"
        type="range"
        min={RATE_MIN}
        max={RATE_MAX}
        step={RATE_STEP}
        value={rate}
        onChange={(e) => setRate(Number(e.currentTarget.value))}
        aria-label="Playback speed"
        aria-valuetext={`${rate}×`}
      />
      <span className="speed-slider__value cad-meta" data-testid="speed-value">
        {rate}×
      </span>
    </div>
  );
}
