/**
 * Recommendation / discovery reads for the Home shelves. "Recently played"
 * and "On repeat" are ALBUM shelves here — Navidrome tracks recency/frequency
 * at album grain (getAlbumList2), unlike Jellyfin's per-song per-user reads.
 * "Suggested for you" has no personalized-suggestions endpoint in Subsonic,
 * so it draws from getRandomSongs — an honest discovery shelf, not a fake
 * personalized pick.
 */
import { request } from './navidromeFetch';
import { mediaItemFromAlbum, mediaItemFromSong } from './navidromeMapper';
import type { MediaItem } from './navidromeTypes';
import type { SubsonicAlbum, SubsonicChild } from './subsonicTypes';

async function albumList2(type: string, size: number): Promise<MediaItem[]> {
  const res = await request<{ albumList2: { album?: SubsonicAlbum[] } }>('/getAlbumList2', {
    params: { type, size },
  });
  return (res.albumList2.album ?? []).map(mediaItemFromAlbum);
}

/** Recently-added albums ("Recently added" shelf). */
export function getLatestAlbums(limit = 20): Promise<MediaItem[]> {
  return albumList2('newest', limit);
}

/** Recently-played albums ("Recently played" shelf). */
export function getRecentlyPlayed(limit = 20): Promise<MediaItem[]> {
  return albumList2('recent', limit);
}

/** Your most-played albums ("On repeat" shelf). */
export function getOnRepeat(limit = 20): Promise<MediaItem[]> {
  return albumList2('frequent', limit);
}

/** Random songs ("Suggested for you" shelf). */
export async function getSuggestedSongs(limit = 20): Promise<MediaItem[]> {
  const res = await request<{ randomSongs: { song?: SubsonicChild[] } }>('/getRandomSongs', {
    params: { size: limit },
  });
  return (res.randomSongs.song ?? []).map(mediaItemFromSong);
}
