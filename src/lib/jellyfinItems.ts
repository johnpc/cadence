/**
 * Thin typed reads/writes over the Jellyfin item endpoints. Each is a few lines
 * calling `request`; feature `xApi.ts` modules wrap these in react-query.
 */
import { request } from './jellyfinFetch';
import { getSession } from './sessionStore';
import type { ItemsResponse, JellyfinItem } from './jellyfinTypes';

const audioFields = 'Artists,AlbumArtist,Album,AlbumId,RunTimeTicks';

/** A page of audio tracks from the library (used to seed playback + tests). */
export async function getAudioItems(limit = 50): Promise<JellyfinItem[]> {
  const userId = getSession()?.userId ?? '';
  const params = new URLSearchParams({
    IncludeItemTypes: 'Audio',
    Recursive: 'true',
    Limit: String(limit),
    SortBy: 'SortName',
    Fields: audioFields,
    userId,
  });
  const res = await request<ItemsResponse>(`/Items?${params.toString()}`);
  return res.Items;
}
