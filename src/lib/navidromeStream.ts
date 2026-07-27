/**
 * Pure URL builders for media the browser loads by `src` (an <audio>/<img>
 * element, not fetch). Auth rides in the query string here — the same
 * u/t/s/v/c/f params as every other Subsonic call (element loads can't send
 * an Authorization header, but Subsonic never used one anyway — one auth
 * mechanism for everything, not a special case for these two).
 */
import { restUrl, subsonicAuthParams } from './navidromeConfig';
import { getSession } from './sessionStore';
import { currentBitrateCap } from '../features/settings/audioQualityStore';
import type { MediaItem } from './navidromeTypes';

/** Streamable audio URL for a track. Honours the user's audio-quality setting
 * by capping the transcode bitrate (Subsonic's `maxBitRate`, in kbps —
 * Cadence stores the cap in bits/sec). 'auto' sends no cap and no format,
 * letting Navidrome direct-play or choose its own transcode target. */
export function audioStreamUrl(itemId: string): string {
  const params = subsonicAuthParams(getSession());
  params.set('id', itemId);
  const cap = currentBitrateCap();
  if (cap) {
    params.set('maxBitRate', String(Math.round(cap / 1000)));
    // A cap needs an explicit lossy target — an uncapped transcode decision
    // would otherwise ignore maxBitRate entirely.
    params.set('format', 'mp3');
  }
  return restUrl(`/stream?${params.toString()}`);
}

/** Cover-art URL for an item, or null when it has no art. Falls back to the
 * album's art for a track. No cache-busting tag is needed — Navidrome sets a
 * long-lived cache-control on getCoverArt unconditionally. */
export function imageUrl(item: MediaItem, maxSize = 400): string | null {
  const id = item.ImageTags?.Primary ? item.Id : item.AlbumId;
  if (!id) return null;
  const params = subsonicAuthParams(getSession());
  params.set('id', id);
  params.set('size', String(maxSize));
  return restUrl(`/getCoverArt?${params.toString()}`);
}
