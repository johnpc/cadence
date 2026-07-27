/**
 * Artist reads — metadata, the albums belonging to an artist, top/all tracks.
 */
import { request } from './navidromeFetch';
import { getStarred2, getAlbumTracks } from './navidromeItems';
import { mediaItemFromArtist, mediaItemFromAlbum, mediaItemFromSong } from './navidromeMapper';
import { dedupeByName } from './dedupeByName';
import { dedupeByTitle } from './dedupeByTitle';
import type { MediaItem } from './navidromeTypes';
import type { SubsonicArtist, SubsonicChild } from './subsonicTypes';

async function fetchArtist(id: string): Promise<SubsonicArtist> {
  const res = await request<{ artist: SubsonicArtist }>('/getArtist', { params: { id } });
  return res.artist;
}

/** The artist's own metadata (name, image, album count). */
export async function getArtist(id: string): Promise<MediaItem> {
  return mediaItemFromArtist(await fetchArtist(id));
}

/** All albums credited to an artist — getArtist returns them in one call
 * (ArtistWithAlbumsID3), unlike Jellyfin's separate /Items read. */
export async function getArtistAlbums(artistId: string): Promise<MediaItem[]> {
  const artist = await fetchArtist(artistId);
  return (artist.album ?? []).map(mediaItemFromAlbum);
}

/** The user's followed artists, alphabetically. */
export async function getFavoriteArtists(): Promise<MediaItem[]> {
  const { artist } = await getStarred2();
  return dedupeByName(artist.map(mediaItemFromArtist)).sort((a, b) => a.Name.localeCompare(b.Name));
}

/** Hydrate a set of artist ids into full items, preserving the caller's order
 * (e.g. ranked related-artist ids). A missing artist is dropped rather than
 * failing the whole batch — Subsonic has no batch-by-id endpoint. */
export async function getArtistsByIds(ids: string[]): Promise<MediaItem[]> {
  if (ids.length === 0) return [];
  const artists = await Promise.all(ids.map((id) => getArtist(id).catch(() => null)));
  const byId = new Map(artists.filter((a): a is MediaItem => a !== null).map((a) => [a.Id, a]));
  return ids.map((id) => byId.get(id)).filter((a): a is MediaItem => a !== undefined);
}

/** An artist's most-played tracks ("Popular"). getTopSongs takes the artist's
 * NAME, not id, so this fetches the artist first (over-fetches song count to
 * collapse cross-album duplicates — a song + its live/remaster/single copies
 * — and still fill `limit` distinct tracks). */
export async function getArtistTopTracks(artistId: string, limit = 5): Promise<MediaItem[]> {
  const artist = await fetchArtist(artistId);
  const res = await request<{ topSongs: { song?: SubsonicChild[] } }>('/getTopSongs', {
    params: { artist: artist.name, count: Math.max(limit * 4, 20) },
  });
  const songs = (res.topSongs.song ?? []).map(mediaItemFromSong);
  return dedupeByTitle(songs).slice(0, limit);
}

/** Every track by an artist, A–Z — the "See all" list behind the Popular
 * section's short preview. Subsonic has no flat "all songs by artist"
 * endpoint, so this fetches every album (from getArtist) then each album's
 * tracks and flattens — cacheable, and preserves the existing A–Z UX. */
export async function getArtistTracks(artistId: string): Promise<MediaItem[]> {
  const artist = await fetchArtist(artistId);
  const perAlbum = await Promise.all(
    (artist.album ?? []).map((album) => getAlbumTracks(album.id).catch(() => [])),
  );
  return perAlbum.flat().sort((a, b) => a.Name.localeCompare(b.Name));
}
