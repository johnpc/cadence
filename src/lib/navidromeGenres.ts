/** Genre reads — tracks tagged with a given music genre, for the genre pages. */
import { request } from './navidromeFetch';
import { mediaItemFromSong } from './navidromeMapper';
import type { MediaItem } from './navidromeTypes';
import type { SubsonicChild } from './subsonicTypes';

/** Audio tracks tagged with `genre` — the Spotify-style genre page. */
export async function getGenreTracks(genre: string, limit = 100): Promise<MediaItem[]> {
  const res = await request<{ songsByGenre: { song?: SubsonicChild[] } }>('/getSongsByGenre', {
    params: { genre, count: limit },
  });
  return (res.songsByGenre.song ?? []).map(mediaItemFromSong);
}
