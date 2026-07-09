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

/** Rank a candidate against the query: exact name = best, then prefix, then
 * substring; artists/albums/playlists outrank songs (Spotify's bias). */
function score(item: JellyfinItem, q: string): number {
  const name = item.Name.trim().toLowerCase();
  let s = 0;
  if (name === q) s = 300;
  else if (name.startsWith(q)) s = 200;
  else if (name.includes(q)) s = 100;
  if (item.Type !== 'Audio') s += 25; // prefer artist/album/playlist as the hero
  return s;
}

/** The single best match to feature as the "Top result", or null. Scans all
 * groups; ties break toward the higher score (artist/album over song). */
export function topResult(groups: SearchGroups, query: string): JellyfinItem | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  const all = [...groups.artists, ...groups.albums, ...groups.playlists, ...groups.songs];
  let best: JellyfinItem | null = null;
  let bestScore = 0;
  for (const item of all) {
    const s = score(item, q);
    if (s > bestScore) {
      best = item;
      bestScore = s;
    }
  }
  return best;
}

/** On the "All" tab, cap each section to a short preview (Spotify shows a few
 * per type; the filter chips reveal the rest). Any other filter shows a single
 * type in full, so it's returned untouched. */
export function previewGroups(groups: SearchGroups, isAll: boolean, limit = 4): SearchGroups {
  if (!isAll) return groups;
  return {
    songs: groups.songs.slice(0, limit),
    albums: groups.albums.slice(0, limit),
    artists: groups.artists.slice(0, limit),
    playlists: groups.playlists.slice(0, limit),
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
