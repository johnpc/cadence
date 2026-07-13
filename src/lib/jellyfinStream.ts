/**
 * Pure URL builders for media the browser loads by `src` (an <audio>/<img>
 * element, not fetch). The token rides in the query string here — the one place
 * it must, since element loads can't send an Authorization header. Acceptable
 * for a self-hosted, per-user Jellyfin token.
 */
import { apiUrl } from './jellyfinConfig';
import { getSession } from './sessionStore';
import { currentBitrateCap } from '../features/settings/audioQualityStore';
import type { JellyfinItem } from './jellyfinTypes';

/** Streamable audio URL for a track, transcoded to a browser-friendly format.
 * Honours the user's audio-quality setting by capping the transcode bitrate
 * (Jellyfin's MaxStreamingBitrate); 'auto' sends no cap. */
export function audioStreamUrl(itemId: string): string {
  const session = getSession();
  const params = new URLSearchParams({
    UserId: session?.userId ?? '',
    api_key: session?.token ?? '',
    // Prefer direct-play; let Jellyfin transcode to aac/mp3 when it must.
    Container: 'opus,mp3,aac,m4a,flac,webma,webm,wav,ogg',
    TranscodingContainer: 'ts',
    AudioCodec: 'aac',
  });
  const cap = currentBitrateCap();
  if (cap) params.set('MaxStreamingBitrate', String(cap));
  return apiUrl(`/Audio/${itemId}/universal?${params.toString()}`);
}

/** Primary cover-art URL for an item, or null when it has no art. Falls back to
 * the album's art for a track. Includes the image `tag` when known so Jellyfin
 * serves it as immutable (`cache-control: max-age=1yr`) — revisits/scroll-backs
 * then hit the browser cache instead of re-requesting (the per-image request
 * pile-up was the app's top request-count cost). `quality` trims transcode bytes
 * ~55% at the same dimensions with no visible loss. */
export function imageUrl(item: JellyfinItem, maxSize = 400): string | null {
  const ownArt = !!item.ImageTags?.Primary;
  const id = ownArt ? item.Id : item.AlbumId;
  if (!id) return null;
  const params = new URLSearchParams({
    fillHeight: String(maxSize),
    fillWidth: String(maxSize),
    quality: '90',
  });
  // The tag is the item's own Primary tag; only valid when we're using its own
  // art (not the album fallback, whose tag we don't have here).
  if (ownArt) params.set('tag', item.ImageTags!.Primary as string);
  return apiUrl(`/Items/${id}/Images/Primary?${params.toString()}`);
}
