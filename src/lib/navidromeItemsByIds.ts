/**
 * Batch by-id hydration. Subsonic has no kind-agnostic (or even kind-specific)
 * batch-by-id endpoint, so each of these fans out N `getX` calls and
 * reassembles them in the caller's given order — used for ranked id lists
 * (similar-albums, marlin search hits). Split from navidromeItems.ts to keep
 * both files under the line limit.
 */
import { getSong, getAlbum } from './navidromeItems';
import type { MediaItem } from './navidromeTypes';

/** Hydrate album ids into full items, preserving the caller's order (e.g.
 * ranked similar-album ids). A missing/deleted album is dropped rather than
 * failing the whole batch — Subsonic has no batch-by-id endpoint. */
export async function getAlbumsByIds(ids: string[]): Promise<MediaItem[]> {
  if (ids.length === 0) return [];
  const albums = await Promise.all(ids.map((id) => getAlbum(id).catch(() => null)));
  const byId = new Map(albums.filter((a): a is MediaItem => a !== null).map((a) => [a.Id, a]));
  return ids.map((id) => byId.get(id)).filter((a): a is MediaItem => a !== undefined);
}

/** Hydrate song ids into full items, preserving the caller's order (e.g. a
 * search backend's ranked id list). A missing/deleted song is dropped rather
 * than failing the whole batch — Subsonic has no batch-by-id endpoint. */
export async function getSongsByIds(ids: string[]): Promise<MediaItem[]> {
  if (ids.length === 0) return [];
  const songs = await Promise.all(ids.map((id) => getSong(id).catch(() => null)));
  const byId = new Map(songs.filter((s): s is MediaItem => s !== null).map((s) => [s.Id, s]));
  return ids.map((id) => byId.get(id)).filter((s): s is MediaItem => s !== undefined);
}
