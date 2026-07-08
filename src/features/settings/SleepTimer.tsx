import { usePlayer } from '../player/usePlayer';
import './sleepTimer.css';

const OPTIONS: { label: string; minutes: number | null }[] = [
  { label: 'Off', minutes: null },
  { label: '15 min', minutes: 15 },
  { label: '30 min', minutes: 30 },
  { label: '1 hour', minutes: 60 },
];

/** Settings "Sleep timer" control — pauses playback after the chosen duration. */
export function SleepTimer() {
  const { sleepMinutes, armSleep } = usePlayer();
  return (
    <section className="sleep">
      <h2 className="sleep__title cad-kicker">Sleep timer</h2>
      <div className="sleep__options" role="group" aria-label="Sleep timer">
        {OPTIONS.map((o) => {
          const active = sleepMinutes === o.minutes;
          return (
            <button
              key={o.label}
              type="button"
              className={active ? 'sleep__option sleep__option--active' : 'sleep__option'}
              aria-pressed={active}
              data-testid={`sleep-${o.minutes ?? 'off'}`}
              onClick={() => armSleep(o.minutes)}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
