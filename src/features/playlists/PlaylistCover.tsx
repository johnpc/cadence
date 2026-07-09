import { TrackArt } from '../player/TrackArt';
import { mosaicUrls } from './mosaicArt';
import type { JellyfinItem } from '../../lib/jellyfinTypes';
import './playlistCover.css';

/** The playlist's cover: its own art when it has one, else a Spotify-style 2×2
 * mosaic built from the first tracks' album art, else TrackArt's placeholder.
 * Jellyfin doesn't always auto-generate a playlist cover, so this keeps a
 * genuinely art-less playlist from showing a bare note icon. */
export function PlaylistCover({
  playlist,
  tracks,
  size = 160,
}: {
  playlist: JellyfinItem | null;
  tracks: JellyfinItem[];
  size?: number;
}) {
  const hasOwnArt = !!playlist?.ImageTags?.Primary;
  const tiles = hasOwnArt ? [] : mosaicUrls(tracks, size);

  // Own art, or too little track art for a mosaic → the standard cover/placeholder.
  if (hasOwnArt || tiles.length < 4) {
    return <TrackArt item={playlist} size={size} />;
  }
  return (
    <div className="pl-mosaic" style={{ width: size, height: size }} data-testid="playlist-mosaic">
      {tiles.map((url) => (
        <img key={url} className="pl-mosaic__tile" src={url} alt="" loading="lazy" />
      ))}
    </div>
  );
}
