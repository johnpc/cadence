import type { JellyfinItem } from '../../lib/jellyfinTypes';

export interface SearchGroups {
  songs: JellyfinItem[];
  albums: JellyfinItem[];
  artists: JellyfinItem[];
}

/** Split a flat result list into the three Spotify-style sections. */
export function groupResults(items: JellyfinItem[]): SearchGroups {
  return {
    songs: items.filter((i) => i.Type === 'Audio'),
    albums: items.filter((i) => i.Type === 'MusicAlbum'),
    artists: items.filter((i) => i.Type === 'MusicArtist'),
  };
}

/** True when no group has any results. */
export function isEmptyGroups(groups: SearchGroups): boolean {
  return !groups.songs.length && !groups.albums.length && !groups.artists.length;
}
