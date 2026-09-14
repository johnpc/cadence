/**
 * Client for audiobook chapters, read from Jellyfin 12's native extraction
 * (GET /Items/{itemId}?fields=Chapters). Jellyfin 12 probes m4b/m4a files and
 * exposes their embedded chapter markers on the item's `Chapters` field, so the
 * CadenceConfig plugin endpoint is no longer needed here. The standard request
 * wrapper attaches the signed-in user's auth header; `userId` scopes the item
 * lookup the same way the library reads do. Returns an empty array for a file
 * with no chapters (a normal, non-error case — e.g. mp3-per-chapter sets), so
 * callers can treat "no chapters" as "not an audiobook with navigation"
 * without special-casing errors.
 */
import { request } from '../../lib/jellyfinFetch';
import { getSession } from '../../lib/sessionStore';
import type { AudiobookChapter } from './audiobookTypes';

/** Jellyfin's native chapter marker: `StartPositionTicks` is in .NET ticks
 * (10,000,000 per second) — converted to seconds before leaving this module. */
interface NativeChapter {
  Name?: string;
  StartPositionTicks?: number;
}

/** The slice of the /Items/{id} response this call consumes. */
interface ChaptersResponse {
  Chapters?: NativeChapter[];
}

const TICKS_PER_SECOND = 10_000_000;

/** Fetch the embedded chapters for an audiobook item. Returns [] when the file
 * has none. Throws (via request) only on a real transport/auth failure, which
 * react-query surfaces as isError. */
export async function fetchChapters(itemId: string): Promise<AudiobookChapter[]> {
  const userId = getSession()?.userId ?? '';
  const params = new URLSearchParams({ fields: 'Chapters', userId });
  const res = await request<ChaptersResponse>(
    `/Items/${encodeURIComponent(itemId)}?${params.toString()}`,
  );
  return (res.Chapters ?? []).map((c) => ({
    name: c.Name ?? '',
    start: (c.StartPositionTicks ?? 0) / TICKS_PER_SECOND,
  }));
}
