import { useState } from 'react';
import { PLAYBACK_RATES } from '../player/playbackPrefs';
import { rateLabel } from './rateLabel';

/** Whether the preset strip is showing. One value, not a boolean pair. */
type SpeedStrip = 'closed' | 'open';

/**
 * The read-along sheet's speed control: a pill showing the current rate; tapping
 * it opens a strip of presets just above the transport, and picking one sets the
 * speed and closes the strip. Speed changes happen while reading, so they also
 * hand the view back to the narration (`onAct`).
 */
export function SpeedControl({
  rate,
  onRate,
  onAct,
}: {
  rate: number;
  onRate: (rate: number) => void;
  onAct: () => void;
}) {
  const [strip, setStrip] = useState<SpeedStrip>('closed');
  const pick = (r: number) => {
    onRate(r);
    setStrip('closed');
    onAct();
  };
  return (
    <div className="readalong__speed">
      {strip === 'open' && (
        <div className="readalong__speed-strip" role="menu" aria-label="Playback speed">
          {PLAYBACK_RATES.map((r) => (
            <button
              key={r}
              role="menuitemradio"
              aria-checked={r === rate}
              className={
                r === rate
                  ? 'readalong__speed-opt readalong__speed-opt--on'
                  : 'readalong__speed-opt'
              }
              onClick={() => pick(r)}
              data-testid="readalong-speed-option"
            >
              {rateLabel(r)}
            </button>
          ))}
        </div>
      )}
      <button
        className="readalong__speed-pill"
        onClick={() => setStrip(strip === 'open' ? 'closed' : 'open')}
        aria-label={`Playback speed ${rateLabel(rate)}`}
        aria-expanded={strip === 'open'}
        data-testid="readalong-speed"
      >
        {rateLabel(rate)}
      </button>
    </div>
  );
}
