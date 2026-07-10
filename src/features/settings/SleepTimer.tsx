import { usePlayer } from '../player/usePlayer';
import type { SleepMode } from '../player/useSleepTimer';
import './sleepTimer.css';

const OPTIONS: { label: string; mode: SleepMode; key: string }[] = [
  { label: 'Off', mode: null, key: 'off' },
  { label: '15 min', mode: 15, key: '15' },
  { label: '30 min', mode: 30, key: '30' },
  { label: '1 hour', mode: 60, key: '60' },
  { label: 'End of track', mode: 'track', key: 'track' },
];

/** Settings "Sleep timer" control — pauses playback after the chosen duration,
 * or at the end of the current track ("End of track", Spotify-style). */
export function SleepTimer() {
  const { sleepMode, armSleep } = usePlayer();
  return (
    <section className="sleep">
      <h2 className="sleep__title cad-kicker">Sleep timer</h2>
      <div className="sleep__options" role="group" aria-label="Sleep timer">
        {OPTIONS.map((o) => {
          const active = sleepMode === o.mode;
          return (
            <button
              key={o.key}
              type="button"
              className={active ? 'sleep__option sleep__option--active' : 'sleep__option'}
              aria-pressed={active}
              data-testid={`sleep-${o.key}`}
              onClick={() => armSleep(o.mode)}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
