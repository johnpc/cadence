import { useState } from 'react';
import { musicalNotes } from 'ionicons/icons';
import { IonIcon } from '@ionic/react';
import { imageUrl } from '../../lib/jellyfinStream';
import type { JellyfinItem } from '../../lib/jellyfinTypes';
import './trackArt.css';

/** Square cover art for a track/album, with a note-icon placeholder fallback
 * (used both when the item has no art and when the image fails to load). */
export function TrackArt({ item, size = 48 }: { item: JellyfinItem | null; size?: number }) {
  const [failed, setFailed] = useState(false);
  const src = item ? imageUrl(item, size * 2) : null;
  return (
    <div className="track-art" style={{ width: size, height: size }}>
      {src && !failed ? (
        <img
          className="track-art__img"
          src={src}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <IonIcon className="track-art__placeholder" icon={musicalNotes} aria-hidden="true" />
      )}
    </div>
  );
}
