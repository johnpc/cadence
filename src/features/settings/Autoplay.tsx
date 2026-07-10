import { IonToggle } from '@ionic/react';
import { useAutoplay } from './useAutoplay';
import './autoplay.css';

/** Settings "Autoplay" control — when on, Cadence keeps playing similar songs
 * (instant-mix radio) once your queue ends, Spotify-style. Off stops music at
 * the end of the queue. */
export function Autoplay() {
  const { autoplay, setAutoplay } = useAutoplay();
  return (
    <section className="autoplay">
      <div className="autoplay__row">
        <div className="autoplay__text">
          <h2 className="autoplay__title cad-kicker">Autoplay</h2>
          <p className="cad-meta">Keep playing similar songs when your music ends.</p>
        </div>
        <IonToggle
          checked={autoplay}
          onIonChange={(e) => setAutoplay(e.detail.checked)}
          aria-label="Autoplay similar songs"
          data-testid="autoplay-toggle"
        />
      </div>
    </section>
  );
}
