import { IonIcon } from '@ionic/react';
import './collectionHero.css';

/** A Spotify-style hero for the pseudo-playlist pages (Liked Songs, Downloads)
 * that have no cover art: an icon tile on a themed gradient, a kicker, the
 * title, and a song/duration summary. `variant` picks the gradient palette. */
export function CollectionHero({
  icon,
  title,
  summary,
  variant,
}: {
  icon: string;
  title: string;
  summary: string;
  variant: 'liked' | 'downloads';
}) {
  return (
    <div className={`coll-hero coll-hero--${variant}`} data-testid="collection-hero">
      <div className="coll-hero__tile" aria-hidden="true">
        <IonIcon icon={icon} />
      </div>
      <div className="coll-hero__meta">
        <span className="cad-kicker">Playlist</span>
        <h1 className="coll-hero__title cad-headline">{title}</h1>
        <p className="cad-meta" data-testid="collection-hero-summary">
          {summary}
        </p>
      </div>
    </div>
  );
}
