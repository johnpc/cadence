/**
 * Reads over the Jellyfin audiobook library for the browse surface. Books are
 * `Type: AudioBook` items; we fetch them with the resume position + played flag
 * so the page can show "Continue listening" and progress.
 */
import { request } from '../../lib/jellyfinFetch';
import { getSession } from '../../lib/sessionStore';
import type { ItemsResponse, JellyfinItem } from '../../lib/jellyfinTypes';

// ParentId + Album + AlbumArtist + IndexNumber drive multi-file book grouping
// (groupBooks); RunTimeTicks/Artists/Overview are for display.
const bookFields = 'RunTimeTicks,Overview,Artists,AlbumArtist,Album,ParentId,IndexNumber';

/** Every audiobook in the library, alphabetical. */
export async function getAudiobooks(limit = 500): Promise<JellyfinItem[]> {
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

/** In-progress audiobooks (has a saved resume position, not finished), most
 * recently played first — the "Continue listening" row. */
export async function getResumableAudiobooks(limit = 20): Promise<JellyfinItem[]> {
  const userId = getSession()?.userId ?? '';
  const params = new URLSearchParams({
    IncludeItemTypes: 'AudioBook',
    Recursive: 'true',
    Filters: 'IsResumable',
    SortBy: 'DatePlayed',
    SortOrder: 'Descending',
    Limit: String(limit),
    Fields: bookFields,
    userId,
  });
  const res = await request<ItemsResponse>(`/Items?${params.toString()}`);
  return res.Items;
}
