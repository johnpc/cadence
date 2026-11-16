/**
 * Playlist LIST reads (own vs others'). Split from jellyfinPlaylists to keep
 * both files under the line limit.
 */
import { request } from './jellyfinFetch';
import { getSession } from './sessionStore';
import { dedupeByName } from './dedupeByName';
import { isPlaylistOwner, ownPlaylistIdsFromServer } from './playlistOwnership';
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

/** Confirm which playlists the user actually owns. The plugin answers for all
 * of them in one call when installed. Otherwise `CanDelete===false` is a
 * definite "not mine" (no probe), and every other candidate is answered by
 * playlistOwnership — remembered per user, deduped, so only playlists never
 * seen before cost a request. Returns the owned ids. */
async function confirmOwnership(playlists: JellyfinItem[]): Promise<Set<string>> {
  const fromServer = await ownPlaylistIdsFromServer();
  if (fromServer) return new Set(playlists.filter((p) => fromServer.has(p.Id)).map((p) => p.Id));
  const candidates = playlists.filter((p) => p.CanDelete !== false);
  const confirmed = await Promise.all(candidates.map((p) => isPlaylistOwner(p.Id)));
  return new Set(candidates.filter((_, i) => confirmed[i]).map((p) => p.Id));
}

/** Partition playlists into [owned, notOwned].
 *
 * `CanDelete` on the LIST endpoint is NOT a usable ownership signal: it's `true`
 * on every playlist for an admin (they can delete anything) and, since Jellyfin
 * 12, for a plain user too (the bulk `/Items` list reports `true` for all 34
 * playlists on the server while the single-item GET still says `false`).
 * Trusting it dumped the whole server into "Your Library" and emptied the
 * community shelf. So: `CanDelete===false` is still a cheap definite "not mine"
 * (older servers), and every other candidate is confirmed via the owner-only
 * share endpoint — once per playlist ever, per user (playlistOwnership). */
async function partitionByOwnership(
  playlists: JellyfinItem[],
): Promise<[JellyfinItem[], JellyfinItem[]]> {
  const ownedIds = await confirmOwnership(playlists);
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
  // Extra Fields ride the same fetch (no extra call): UserData→IsFavorite bubbles
  // hearted playlists up; the dates feed the added/updated library sorts.
  const fields = 'CanDelete,UserData,DateCreated,DateLastMediaAdded';
  const all = await fetchAllPlaylists('SortName', fields);
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
