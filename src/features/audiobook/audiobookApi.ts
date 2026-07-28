/**
 * Client for the audiobook chapters endpoint served by the CadenceConfig Jellyfin
 * plugin (GET /Cadence/Audiobooks/{itemId}/Chapters). It runs against Jellyfin
 * itself, so the standard request wrapper's Emby auth header rides along; no proxy
 * or secret is involved. Returns an empty array for a file with no chapters (a
 * normal, non-error case), so callers can treat "no chapters" as "not an
 * audiobook with navigation" without special-casing errors.
 */
import { request } from '../../lib/jellyfinFetch';
import type { AudiobookChapter } from './audiobookTypes';

/** Fetch the embedded chapters for an audiobook item. Returns [] when the file
 * has none. Throws (via request) only on a real transport/auth failure, which
 * react-query surfaces as isError. */
export async function fetchChapters(itemId: string): Promise<AudiobookChapter[]> {
  return request<AudiobookChapter[]>(`/Cadence/Audiobooks/${encodeURIComponent(itemId)}/Chapters`);
}
