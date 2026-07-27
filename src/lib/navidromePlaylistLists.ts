/**
 * Playlist LIST + single-playlist reads. Split from navidromePlaylists to
 * keep both files under the line limit.
 */
import { request } from './navidromeFetch';
import { getSession } from './sessionStore';
import { dedupeByName } from './dedupeByName';
import { mediaItemFromPlaylist, mediaItemFromPlaylistEntry } from './navidromeMapper';
import type { MediaItem } from './navidromeTypes';
import type { SubsonicPlaylist } from './subsonicTypes';

async function fetchAllPlaylists(): Promise<SubsonicPlaylist[]> {
  const res = await request<{ playlists: { playlist?: SubsonicPlaylist[] } }>('/getPlaylists');
  return res.playlists.playlist ?? [];
}

/** The signed-in user's OWN playlists, deduped by name. Navidrome exposes the
 * owner's username directly on every playlist, so ownership is a single
 * client-side filter — no second confirmation call needed (unlike Jellyfin,
 * which required an owner-only `/Playlists/{id}/Users` probe per candidate). */
export async function getPlaylists(): Promise<MediaItem[]> {
  const username = getSession()?.username ?? '';
  const all = await fetchAllPlaylists();
  const mine = all.filter((p) => p.owner === username);
  return dedupeByName(mine.map((p) => mediaItemFromPlaylist(p, username)));
}

/** OTHER users' PUBLIC playlists, newest first — surfaced on Home so the user
 * can browse and clone them. Navidrome's getPlaylists already scopes non-admin
 * users to public-or-owned server-side; the client-side filter is a safety net
 * for the admin-sees-everything edge case. */
export async function getPublicPlaylists(limit = 20): Promise<MediaItem[]> {
  const username = getSession()?.username ?? '';
  const all = await fetchAllPlaylists();
  const notMine = all
    .filter((p) => p.owner !== username)
    .sort((a, b) => b.created.localeCompare(a.created));
  return dedupeByName(notMine.map((p) => mediaItemFromPlaylist(p, username))).slice(0, limit);
}

/** One playlist's header metadata (name, cover art, owner, visibility). */
export async function getPlaylist(id: string): Promise<MediaItem> {
  const res = await request<{ playlist: SubsonicPlaylist }>('/getPlaylist', { params: { id } });
  return mediaItemFromPlaylist(res.playlist, getSession()?.username ?? '');
}

/** The tracks in a playlist, in playlist order. `PlaylistItemId` on each is
 * its array INDEX (stringified) — Subsonic addresses playlist entries by
 * position, so removal/reorder operate on that index (see navidromePlaylists). */
export async function getPlaylistItems(playlistId: string): Promise<MediaItem[]> {
  const res = await request<{ playlist: SubsonicPlaylist }>('/getPlaylist', {
    params: { id: playlistId },
  });
  return (res.playlist.entry ?? []).map((entry, i) => mediaItemFromPlaylistEntry(entry, i));
}
