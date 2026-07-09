import { imageUrl } from '../../lib/jellyfinStream';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** Up to 4 distinct cover-art URLs drawn from a playlist's tracks, for a
 * Spotify-style 2×2 mosaic when the playlist has no cover of its own. Deduped
 * by the source image id so the mosaic isn't four copies of one album; returns
 * fewer than 4 (even 0) when the tracks don't have that much distinct art. */
export function mosaicUrls(tracks: JellyfinItem[], size = 160): string[] {
  const urls: string[] = [];
  const seen = new Set<string>();
  for (const track of tracks) {
    const id = track.ImageTags?.Primary ? track.Id : track.AlbumId;
    if (!id || seen.has(id)) continue;
    const url = imageUrl(track, size);
    if (!url) continue;
    seen.add(id);
    urls.push(url);
    if (urls.length === 4) break;
  }
  return urls;
}
