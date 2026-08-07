/**
 * Reads over the Jellyfin audiobook library for the browse surface. Books are
 * `Type: AudioBook` items; we fetch them with the resume position + played flag
 * so the page can show "Continue listening" and progress.
 */
import { request } from '../../lib/jellyfinFetch';
import { getSession } from '../../lib/sessionStore';
import type { ItemsResponse, JellyfinItem } from '../../lib/jellyfinTypes';

// ParentId + Album + AlbumArtist + IndexNumber drive multi-file book grouping
// (groupBooks); the rest are for display — RunTimeTicks/Artists/Overview plus
// Genres/ProductionYear/DateCreated for the detail page's facts + chips.
const bookFields =
  'RunTimeTicks,Overview,Artists,AlbumArtist,Album,ParentId,IndexNumber,Genres,ProductionYear,DateCreated';

/** Every audiobook in the library, alphabetical. The limit must exceed the
 * library size (900+ files across all books) or later books (e.g. "Circe")
 * silently drop off the end — grouping needs ALL parts to build each book. */
export async function getAudiobooks(limit = 5000): Promise<JellyfinItem[]> {
  const userId = getSession()?.userId ?? '';
  const params = new URLSearchParams({
    IncludeItemTypes: 'AudioBook',
    Recursive: 'true',
    SortBy: 'SortName',
    SortOrder: 'Ascending',
    Limit: String(limit),
    Fields: bookFields,
    userId,
  });
  const res = await request<ItemsResponse>(`/Items?${params.toString()}`);
  return res.Items;
}

/** Audiobooks matching a Jellyfin filter (e.g. IsResumable, IsFavorite), most
 * recently played first. Shared by the "Continue listening & favorites" section. */
async function getBooksByFilter(filter: string, limit: number): Promise<JellyfinItem[]> {
  const userId = getSession()?.userId ?? '';
  const params = new URLSearchParams({
    IncludeItemTypes: 'AudioBook',
    Recursive: 'true',
    Filters: filter,
    SortBy: 'DatePlayed',
    SortOrder: 'Descending',
    Limit: String(limit),
    Fields: bookFields,
    userId,
  });
  const res = await request<ItemsResponse>(`/Items?${params.toString()}`);
  return res.Items;
}

/** In-progress audiobooks (saved resume position, not finished) — most recent
 * first. The "Continue listening" part of the top section. */
export function getResumableAudiobooks(limit = 20): Promise<JellyfinItem[]> {
  return getBooksByFilter('IsResumable', limit);
}

/** Favorited audiobooks — surfaced in the top section alongside in-progress. */
export function getFavoriteAudiobooks(limit = 50): Promise<JellyfinItem[]> {
  return getBooksByFilter('IsFavorite', limit);
}
