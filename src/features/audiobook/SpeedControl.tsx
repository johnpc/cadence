import { useState } from 'react';
import { PLAYBACK_RATES } from '../player/playbackPrefs';
import { rateLabel } from './rateLabel';
import './speedControl.css';

/** Whether the preset strip is showing. One value, not a boolean pair. */
type SpeedStrip = 'closed' | 'open';

/**
 * The audiobook speed control, the same in the full player and the read-along
 * sheet: a pill showing the current rate; tapping it opens a strip of presets
 * floating above it, and picking one sets the speed and closes the strip.
 * `align` anchors the strip to the pill's centre or its right edge (the sheet's
 * pill ends a row). `onAct` lets the sheet hand the view back to the narration.
 */
export function SpeedControl({
  rate,
  onRate,
  onAct,
  testPrefix,
  align = 'center',
}: {
  rate: number;
  onRate: (rate: number) => void;
  onAct?: () => void;
  testPrefix: string;
  align?: 'center' | 'end';
}) {
  const [strip, setStrip] = useState<SpeedStrip>('closed');
  const pick = (r: number) => {
    onRate(r);
    setStrip('closed');
    onAct?.();
  };
  return (
    <div className={`speed-control speed-control--${align}`}>
      {strip === 'open' && (
        <div className="speed-control__strip" role="menu" aria-label="Playback speed">
          {PLAYBACK_RATES.map((r) => (
            <button
              key={r}
              type="button"
              role="menuitemradio"
              aria-checked={r === rate}
              className={
                r === rate ? 'speed-control__opt speed-control__opt--on' : 'speed-control__opt'
              }
              onClick={() => pick(r)}
              data-testid={`${testPrefix}speed-option`}
            >
              {rateLabel(r)}
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        className="cad-pill"
        onClick={() => setStrip(strip === 'open' ? 'closed' : 'open')}
        aria-label={`Playback speed ${rateLabel(rate)}`}
        aria-expanded={strip === 'open'}
        data-testid={`${testPrefix}speed`}
      >
        {rateLabel(rate)}
      </button>
    </div>
  );
}
