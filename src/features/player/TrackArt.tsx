import { musicalNotes } from 'ionicons/icons';
import { IonIcon } from '@ionic/react';
import { imageUrl } from '../../lib/jellyfinStream';
import type { JellyfinItem } from '../../lib/jellyfinTypes';
import './trackArt.css';

/** Square cover art for a track/album, with a note-icon placeholder fallback. */
export function TrackArt({ item, size = 48 }: { item: JellyfinItem | null; size?: number }) {
  const src = item ? imageUrl(item, size * 2) : null;
  return (
    <div className="track-art" style={{ width: size, height: size }}>
      {src ? (
        <img className="track-art__img" src={src} alt="" loading="lazy" />
      ) : (
        <IonIcon className="track-art__placeholder" icon={musicalNotes} aria-hidden="true" />
      )}
    </div>
  );
}
