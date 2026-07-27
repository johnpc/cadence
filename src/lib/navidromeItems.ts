/**
 * Thin typed reads/writes over the Subsonic song/album/favorite endpoints.
 * Each is a few lines calling `request`; feature `xApi.ts` modules wrap these
 * in react-query.
 */
import { request } from './navidromeFetch';
import { mediaItemFromSong, mediaItemFromAlbum } from './navidromeMapper';
import { dedupeTracks } from './dedupeTracks';
import { dedupeByName } from './dedupeByName';
import type { MediaItem } from './navidromeTypes';
import type { SubsonicChild, SubsonicAlbum, SubsonicArtist } from './subsonicTypes';

/** A single track's display fields. */
export async function getSong(id: string): Promise<MediaItem> {
  const res = await request<{ song: SubsonicChild }>('/getSong', { params: { id } });
  return mediaItemFromSong(res.song);
}

/** An album's display fields (name, artist, art, year, genre, track count). */
export async function getAlbum(id: string): Promise<MediaItem> {
  const res = await request<{ album: SubsonicAlbum }>('/getAlbum', { params: { id } });
  return mediaItemFromAlbum(res.album);
}

/** All audio tracks on an album, in disc+track order — getAlbum returns the
 * full song list in one call, unlike Jellyfin's separate paged /Items read
 * (and with no artificial cap to silently drop a large box set's later discs). */
export async function getAlbumTracks(albumId: string): Promise<MediaItem[]> {
  const res = await request<{ album: SubsonicAlbum }>('/getAlbum', { params: { id: albumId } });
  return dedupeTracks((res.album.song ?? []).map(mediaItemFromSong));
}

/** Tracks similar to a seed song/album/artist — Spotify-style radio. Subsonic
 * has no direct "instant mix" concept; getSimilarSongs2 is the closest
 * equivalent and accepts any entity id as the seed. */
export async function getSimilarSongs(id: string, count = 50): Promise<MediaItem[]> {
  const res = await request<{ similarSongs2: { song?: SubsonicChild[] } }>('/getSimilarSongs2', {
    params: { id, count },
  });
  return (res.similarSongs2.song ?? []).map(mediaItemFromSong);
}

/** getStarred2 returns every starred song/album/artist in ONE call — the
 * Subsonic equivalent of Jellyfin's separate per-type favorites reads.
 * Exported so navidromeArtists.ts's getFavoriteArtists shares this shape. */
export async function getStarred2(): Promise<{
  song: SubsonicChild[];
  album: SubsonicAlbum[];
  artist: SubsonicArtist[];
}> {
  const res = await request<{
    starred2: { song?: SubsonicChild[]; album?: SubsonicAlbum[]; artist?: SubsonicArtist[] };
  }>('/getStarred2');
  return {
    song: res.starred2.song ?? [],
    album: res.starred2.album ?? [],
    artist: res.starred2.artist ?? [],
  };
}

/** The user's liked songs. */
export async function getFavoriteSongs(): Promise<MediaItem[]> {
  return (await getStarred2()).song.map(mediaItemFromSong);
}

/** The user's saved albums, most-recent first (Subsonic doesn't sort
 * getStarred2, so callers that need an order should apply one themselves). */
export async function getFavoriteAlbums(): Promise<MediaItem[]> {
  return dedupeByName((await getStarred2()).album.map(mediaItemFromAlbum));
}

export type FavoriteKind = 'song' | 'album' | 'artist';
const FAVORITE_PARAM: Record<FavoriteKind, string> = {
  song: 'id',
  album: 'albumId',
  artist: 'artistId',
};

/** Add a song/album/artist to favorites (song by default — the common case,
 * Liked Songs). Subsonic's star/unstar need to know the KIND (different param
 * name per kind), unlike Jellyfin's one kind-agnostic favorites endpoint. */
export async function addFavorite(id: string, kind: FavoriteKind = 'song'): Promise<void> {
  await request('/star', { params: { [FAVORITE_PARAM[kind]]: id } });
}

/** Remove a song/album/artist from favorites (song by default). */
export async function removeFavorite(id: string, kind: FavoriteKind = 'song'): Promise<void> {
  await request('/unstar', { params: { [FAVORITE_PARAM[kind]]: id } });
}
