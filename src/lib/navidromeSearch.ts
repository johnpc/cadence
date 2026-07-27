/**
 * Native search via Subsonic's search3 — one call returns songs, albums, and
 * artists together (replacing Jellyfin's separate /Items and /Artists calls).
 * Playlist search has no Subsonic endpoint, so it's a client-side name-filter
 * over the playlists this user can already see (own + others' public) — a
 * privacy improvement over Jellyfin's old /Items?IncludeItemTypes=Playlist,
 * which returned every playlist on the server regardless of ownership (see
 * CLAUDE.md gotcha).
 */
import { request } from './navidromeFetch';
import { getPlaylists, getPublicPlaylists } from './navidromePlaylistLists';
import { mediaItemFromSong, mediaItemFromAlbum, mediaItemFromArtist } from './navidromeMapper';
import type { MediaItem } from './navidromeTypes';
import type { SubsonicChild, SubsonicAlbum, SubsonicArtist } from './subsonicTypes';

interface Search3Result {
  song?: SubsonicChild[];
  album?: SubsonicAlbum[];
  artist?: SubsonicArtist[];
}

/** Songs + albums + artists in one call — search3 replaces Jellyfin's
 * separate /Items (songs+albums) and /Artists calls. */
export async function searchMedia(query: string, limit = 40): Promise<MediaItem[]> {
  const res = await request<{ searchResult3: Search3Result }>('/search3', {
    params: { query, songCount: limit, albumCount: 10, artistCount: 10 },
  });
  const { song, album, artist } = res.searchResult3;
  return [
    ...(song ?? []).map(mediaItemFromSong),
    ...(album ?? []).map(mediaItemFromAlbum),
    ...(artist ?? []).map(mediaItemFromArtist),
  ];
}

/** Playlist search: filter client-side over playlists visible to this user
 * (own + others' public) since Subsonic has no playlist-search endpoint. */
export async function searchPlaylists(query: string, limit = 10): Promise<MediaItem[]> {
  const [mine, others] = await Promise.all([getPlaylists(), getPublicPlaylists(100)]);
  const q = query.toLowerCase();
  return [...mine, ...others].filter((p) => p.Name.toLowerCase().includes(q)).slice(0, limit);
}

/** Native Navidrome search: media (search3) + playlists (name filter), merged. */
export async function navidromeSearchSource(query: string, limit = 40): Promise<MediaItem[]> {
  const [media, playlists] = await Promise.all([
    searchMedia(query, limit),
    searchPlaylists(query, 10),
  ]);
  return [...media, ...playlists];
}
