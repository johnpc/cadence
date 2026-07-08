import type { JellyfinItem } from '../../lib/jellyfinTypes';

export interface SearchGroups {
  songs: JellyfinItem[];
  albums: JellyfinItem[];
  artists: JellyfinItem[];
  playlists: JellyfinItem[];
}

/** Split a flat result list into the Spotify-style sections. */
export function groupResults(items: JellyfinItem[]): SearchGroups {
  return {
    songs: items.filter((i) => i.Type === 'Audio'),
    albums: items.filter((i) => i.Type === 'MusicAlbum'),
    artists: items.filter((i) => i.Type === 'MusicArtist'),
    playlists: items.filter((i) => i.Type === 'Playlist'),
  };
}

/** True when no group has any results. */
export function isEmptyGroups(groups: SearchGroups): boolean {
  return (
    !groups.songs.length &&
    !groups.albums.length &&
    !groups.artists.length &&
    !groups.playlists.length
  );
}
