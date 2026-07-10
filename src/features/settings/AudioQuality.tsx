import { useAudioQuality } from './useAudioQuality';
import type { AudioQuality as Quality } from './audioQualityStore';
import './autoplay.css';

const OPTIONS: { label: string; value: Quality }[] = [
  { label: 'Automatic', value: 'auto' },
  { label: 'High', value: 'high' },
  { label: 'Normal', value: 'normal' },
  { label: 'Data saver', value: 'low' },
];

/** Settings "Audio quality" control — caps the streaming bitrate (Spotify's
 * Data Saver / quality tiers). Automatic streams at full quality. */
export function AudioQuality() {
  const { quality, setQuality } = useAudioQuality();
  return (
    <section className="autoplay">
      <h2 className="autoplay__title cad-kicker">Audio quality</h2>
      <p className="cad-meta">Lower quality uses less data on slow or metered connections.</p>
      <div className="segmented" role="group" aria-label="Audio quality">
        {OPTIONS.map((o) => {
          const active = quality === o.value;
          return (
            <button
              key={o.value}
              type="button"
              className={
                active ? 'segmented__option segmented__option--active' : 'segmented__option'
              }
              aria-pressed={active}
              data-testid={`quality-${o.value}`}
              onClick={() => setQuality(o.value)}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
