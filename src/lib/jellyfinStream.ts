/**
 * Pure URL builders for media the browser loads by `src` (an <audio>/<img>
 * element, not fetch). The token rides in the query string here — the one place
 * it must, since element loads can't send an Authorization header. Acceptable
 * for a self-hosted, per-user Jellyfin token.
 */
import { apiUrl } from './jellyfinConfig';
import { getSession } from './sessionStore';
import type { JellyfinItem } from './jellyfinTypes';

/** Streamable audio URL for a track, transcoded to a browser-friendly format. */
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
  return apiUrl(`/Audio/${itemId}/universal?${params.toString()}`);
}

/** Primary cover-art URL for an item, or null when it has no art. Falls back to
 * the album's art for a track. */
export function imageUrl(item: JellyfinItem, maxSize = 400): string | null {
  const id = item.ImageTags?.Primary ? item.Id : item.AlbumId;
  if (!id) return null;
  const params = new URLSearchParams({ fillHeight: String(maxSize), fillWidth: String(maxSize) });
  return apiUrl(`/Items/${id}/Images/Primary?${params.toString()}`);
}
