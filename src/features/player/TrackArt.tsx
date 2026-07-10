import { useState } from 'react';
import { musicalNotes } from 'ionicons/icons';
import { IonIcon } from '@ionic/react';
import { imageUrl } from '../../lib/jellyfinStream';
import type { JellyfinItem } from '../../lib/jellyfinTypes';
import './trackArt.css';

/** Cover art for a track/album/artist, with a note-icon placeholder fallback
 * (used both when the item has no art and when the image fails to load).
 * `round` renders a circle — used for artists; albums/tracks stay square. */
export function TrackArt({
  item,
  size = 48,
  round = false,
}: {
  item: JellyfinItem | null;
  size?: number;
  round?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const src = item ? imageUrl(item, size * 2) : null;
  return (
    <div
      className={round ? 'track-art track-art--round' : 'track-art'}
      style={{ width: size, height: size }}
    >
      {src && !failed ? (
        <img
          // A cached image can already be `complete` before onLoad binds —
          // flip immediately in that case so it doesn't stay stuck faded out.
          ref={(el) => {
            if (el?.complete) setLoaded(true);
          }}
          className={loaded ? 'track-art__img track-art__img--loaded' : 'track-art__img'}
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      ) : (
        <IonIcon className="track-art__placeholder" icon={musicalNotes} aria-hidden="true" />
      )}
    </div>
  );
}
