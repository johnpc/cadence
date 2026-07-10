import { usePlayer } from '../player/usePlayer';
import { PLAYBACK_RATES } from '../player/usePlaybackRate';
import './sleepTimer.css';

/** Settings "Playback speed" control — sets the audio playback rate (0.75×–2×),
 * handy for long mixes or spoken-word content. Persisted per device. */
export function PlaybackSpeed() {
  const { rate, setRate } = usePlayer();
  return (
    <section className="sleep">
      <h2 className="sleep__title cad-kicker">Playback speed</h2>
      <div className="sleep__options" role="group" aria-label="Playback speed">
        {PLAYBACK_RATES.map((r) => (
          <button
            key={r}
            type="button"
            className={rate === r ? 'sleep__option sleep__option--active' : 'sleep__option'}
            aria-pressed={rate === r}
            data-testid={`speed-${r}`}
            onClick={() => setRate(r)}
          >
            {r === 1 ? 'Normal' : `${r}×`}
          </button>
        ))}
      </div>
    </section>
  );
}
