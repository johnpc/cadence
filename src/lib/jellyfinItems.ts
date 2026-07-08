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

/** All audio tracks belonging to a parent (an album or artist), in order. */
export async function getItemTracks(parentId: string, limit = 200): Promise<JellyfinItem[]> {
  const userId = getSession()?.userId ?? '';
  const params = new URLSearchParams({
    ParentId: parentId,
    IncludeItemTypes: 'Audio',
    Recursive: 'true',
    SortBy: 'ParentIndexNumber,IndexNumber,SortName',
    Limit: String(limit),
    Fields: audioFields,
    userId,
  });
  const res = await request<ItemsResponse>(`/Items?${params.toString()}`);
  return res.Items;
}

/** A Jellyfin "instant mix" (radio) seeded from any item — Spotify-style. */
export async function getInstantMix(itemId: string, limit = 50): Promise<JellyfinItem[]> {
  const userId = getSession()?.userId ?? '';
  const params = new URLSearchParams({ Limit: String(limit), Fields: audioFields, userId });
  const res = await request<ItemsResponse>(`/Items/${itemId}/InstantMix?${params.toString()}`);
  return res.Items;
}
