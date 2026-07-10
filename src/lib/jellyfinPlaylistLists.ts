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

/** The signed-in user's OWN playlists, deduped by name. Jellyfin's /Items
 * returns EVERY playlist on the server (all users' + shared), with no
 * OwnerUserId to filter by — so a naive read injected strangers' playlists into
 * everyone's library. `CanDelete` is true only for playlists the current user
 * owns (verified live: creating one flips it true; all others are false), so we
 * filter on it. Others' *public* playlists are surfaced elsewhere (Home), never
 * mixed into "Your Library". */
export async function getPlaylists(): Promise<JellyfinItem[]> {
  const all = await fetchAllPlaylists('SortName', 'CanDelete');
  return dedupeByName(all.filter((p) => p.CanDelete === true));
}

/** OTHER users' playlists — the ones getPlaylists deliberately excludes from
 * Your Library (CanDelete false = not owned by the current user). Surfaced on
 * Home so the user can browse and clone them into their own library, without
 * them masquerading as the user's own. Most-recently-added first; ChildCount
 * drives the "N songs" subtitle. */
export async function getPublicPlaylists(limit = 20): Promise<JellyfinItem[]> {
  const all = await fetchAllPlaylists('DateCreated', 'CanDelete,ChildCount');
  return dedupeByName(all.filter((p) => p.CanDelete !== true)).slice(0, limit);
}
