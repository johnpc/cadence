/**
 * Playlist LIST reads (own vs others'). Split from jellyfinPlaylists to keep
 * both files under the line limit.
 */
import { request } from './jellyfinFetch';
import { getSession } from './sessionStore';
import { dedupeByName } from './dedupeByName';
import type { ItemsResponse, JellyfinItem } from './jellyfinTypes';

async function fetchAllPlaylists(
  sortBy: string,
  fields: string,
  sortOrder: 'Ascending' | 'Descending' = 'Ascending',
): Promise<JellyfinItem[]> {
  const userId = getSession()?.userId ?? '';
  const params = new URLSearchParams({
    IncludeItemTypes: 'Playlist',
    Recursive: 'true',
    SortBy: sortBy,
    // Jellyfin defaults to Ascending when omitted — which for DateCreated buries
    // the NEWEST playlists at the end, where the community shelf's slice(limit)
    // cuts them off. Callers that want newest-first MUST pass Descending.
    SortOrder: sortOrder,
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

/** ADMIN-only: confirm which playlists the admin actually owns. `CanDelete===false`
 * is a definite "not mine" (no probe); every `CanDelete!==false` candidate is
 * confirmed via the owner-only share endpoint (parallel). Returns the owned ids. */
async function confirmAdminOwnership(playlists: JellyfinItem[]): Promise<Set<string>> {
  const candidates = playlists.filter((p) => p.CanDelete !== false);
  const confirmed = await Promise.all(candidates.map((p) => isPlaylistOwner(p.Id)));
  return new Set(candidates.filter((_, i) => confirmed[i]).map((p) => p.Id));
}

/** Partition playlists into [owned, notOwned].
 *
 * For a NON-ADMIN, `CanDelete` is exactly the ownership signal — you can only
 * delete your own playlists — so we partition on it with ZERO extra requests.
 * For an ADMIN, `CanDelete` is `true` on EVERY playlist (they can delete
 * anything), so it can't distinguish owned from others'; only then do we fall
 * back to confirming each `CanDelete!==false` candidate via the owner-only share
 * endpoint (parallel). This keeps the common path free and confines the O(N)
 * probe fan-out to the rare admin case — a chatty storm over slow links. */
async function partitionByOwnership(
  playlists: JellyfinItem[],
): Promise<[JellyfinItem[], JellyfinItem[]]> {
  const ownedIds = getSession()?.isAdmin
    ? await confirmAdminOwnership(playlists)
    : new Set(playlists.filter((p) => p.CanDelete !== false).map((p) => p.Id));
  // Filter the ORIGINAL list so BOTH partitions keep the caller's sort order
  // (e.g. getPublicPlaylists relies on DateCreated-desc — a newly-shared
  // playlist must stay at the front, not sink below the CanDelete:false ones).
  const mine = playlists.filter((p) => ownedIds.has(p.Id));
  const notMine = playlists.filter((p) => !ownedIds.has(p.Id));
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
  const all = await fetchAllPlaylists('DateCreated', 'CanDelete,ChildCount', 'Descending');
  const [, notMine] = await partitionByOwnership(all);
  return dedupeByName(notMine).slice(0, limit);
}
