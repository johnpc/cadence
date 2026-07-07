import { useTheme } from './useTheme';
import type { ThemePreference } from './types';
import './appearance.css';

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

/** Settings "Appearance" control — a System / Light / Dark segmented selector. */
export function Appearance() {
  const { preference, setPreference } = useTheme();
  return (
    <section className="appearance">
      <h2 className="appearance__title cad-kicker">Appearance</h2>
      <div className="appearance__options" role="group" aria-label="Appearance">
        {OPTIONS.map((option) => {
          const active = preference === option.value;
          return (
            <button
              key={option.value}
              type="button"
              className={
                active ? 'appearance__option appearance__option--active' : 'appearance__option'
              }
              aria-pressed={active}
              onClick={() => setPreference(option.value)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
