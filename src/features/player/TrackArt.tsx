import { memo, useState, type CSSProperties } from 'react';
import { IonIcon } from '@ionic/react';
import { artPlaceholder } from './artPlaceholder';
import { imageUrl } from '../../lib/jellyfinStream';
import { useLocalArt } from '../downloads/useLocalArt';
import type { JellyfinItem } from '../../lib/jellyfinTypes';
import './trackArt.css';

/** Cover art for a track/album/artist, with a generated fallback (artPlaceholder)
 * used both when the item has no art and when the image fails to load.
 * `round` renders a circle — used for artists; albums/tracks stay square.
 *
 * Memoized: TrackArt renders in every row/card across the app, and all its
 * props are primitive/stable (item ref, size, round), so React.memo skips the
 * <img> subtree when an unrelated parent re-render happens (play/pause toggle,
 * filter keystroke, track advance) — a broad, cheap render win. */
function TrackArtImpl({
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
  // Prefer a downloaded track's cached art (works offline); else the network URL.
  const localArt = useLocalArt(item);
  const src = localArt ?? (item ? imageUrl(item, size * 2) : null);
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
        <ArtFallback item={item} size={size} round={round} />
      )}
    </div>
  );
}

/** The no-art fill: a name-derived gradient with initials or a kind icon,
 * both sized from the art's own size (not font-size inheritance). */
function ArtFallback({
  item,
  size,
  round,
}: {
  item: JellyfinItem | null;
  size: number;
  round: boolean;
}) {
  const p = artPlaceholder(item, round);
  const style = { '--art-hue': p.hue, fontSize: Math.round(size * 0.36) } as CSSProperties;
  return (
    <span className="track-art__fallback" style={style} aria-hidden="true">
      {p.kind === 'initials' ? (
        <span className="track-art__initials">{p.text}</span>
      ) : (
        <IonIcon className="track-art__placeholder" icon={p.icon} />
      )}
    </span>
  );
}

export const TrackArt = memo(TrackArtImpl);
