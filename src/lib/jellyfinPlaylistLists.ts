/**
 * Playlist LIST reads (own vs others'). Split from jellyfinPlaylists to keep
 * both files under the line limit.
 */
import { request } from './jellyfinFetch';
import { getSession } from './sessionStore';
import { dedupeByName } from './dedupeByName';
import type { ItemsResponse, JellyfinItem } from './jellyfinTypes';

async function fetchAllPlaylists(sortBy: string, fields: string): Promise<JellyfinItem[]> {
  const userId = getSession()?.userId ?? '';
  const params = new URLSearchParams({
    IncludeItemTypes: 'Playlist',
    Recursive: 'true',
    SortBy: sortBy,
    Fields: fields,
    userId,
  });
  const res = await request<ItemsResponse>(`/Items?${params.toString()}`);
  return res.Items;
}

/** True iff the current user OWNS this playlist. `/Playlists/{id}/Users` (the
 * share list) is owner-only: it 200s for the owner and 403s for everyone else —
 * including admins, so unlike `CanDelete` it isn't fooled by an admin's
 * delete-anything permission. Any error (403/timeout) reads as "not mine". */
async function isPlaylistOwner(id: string): Promise<boolean> {
  try {
    await request(`/Playlists/${id}/Users`);
    return true;
  } catch {
    return false;
  }
}

/** Partition playlists into [owned, notOwned]. `CanDelete === false` is a
 * definitive "not mine" (cheap, no extra call). Everything else is CONFIRMED via
 * the owner-only share endpoint — necessary because an ADMIN has `CanDelete`
 * true on every playlist, which would otherwise dump the whole server into their
 * library. Confirmations run in parallel. */
async function partitionByOwnership(
  playlists: JellyfinItem[],
): Promise<[JellyfinItem[], JellyfinItem[]]> {
  const candidates = playlists.filter((p) => p.CanDelete !== false);
  const notMine = playlists.filter((p) => p.CanDelete === false);
  const owned = await Promise.all(candidates.map((p) => isPlaylistOwner(p.Id)));
  const mine: JellyfinItem[] = [];
  candidates.forEach((p, i) => (owned[i] ? mine : notMine).push(p));
  return [mine, notMine];
}

/** The signed-in user's OWN playlists, deduped by name. Jellyfin's /Items
 * returns EVERY playlist on the server with no OwnerUserId to filter by, and
 * `CanDelete` is true for ALL of them when the user is an admin — so we confirm
 * ownership via the owner-only `/Playlists/{id}/Users` endpoint. Others' public
 * playlists are surfaced on Home, never mixed into "Your Library". */
export async function getPlaylists(): Promise<JellyfinItem[]> {
  const all = await fetchAllPlaylists('SortName', 'CanDelete');
  const [mine] = await partitionByOwnership(all);
  return dedupeByName(mine);
}

/** OTHER users' playlists — the ones getPlaylists excludes from Your Library
 * (not owned by the current user). Surfaced on Home so the user can browse and
 * clone them. Most-recently-added first; ChildCount drives the "N songs" line. */
export async function getPublicPlaylists(limit = 20): Promise<JellyfinItem[]> {
  const all = await fetchAllPlaylists('DateCreated', 'CanDelete,ChildCount');
  const [, notMine] = await partitionByOwnership(all);
  return dedupeByName(notMine).slice(0, limit);
}
