import { IonIcon } from '@ionic/react';
import { heart } from 'ionicons/icons';

/** Spotify's signature Liked Songs hero: a big heart tile on a purple gradient,
 * the title, and a song-count/duration summary. Gives Liked Songs the same
 * visual weight as album/artist/playlist pages (which have cover-art heroes),
 * instead of a bare text heading. */
export function LikedSongsHero({ summary }: { summary: string }) {
  return (
    <div className="liked-hero" data-testid="liked-hero">
      <div className="liked-hero__tile" aria-hidden="true">
        <IonIcon icon={heart} />
      </div>
      <div className="liked-hero__meta">
        <span className="cad-kicker">Playlist</span>
        <h1 className="liked-hero__title cad-headline">Liked Songs</h1>
        <p className="cad-meta" data-testid="liked-summary">
          {summary}
        </p>
      </div>
    </div>
  );
}
