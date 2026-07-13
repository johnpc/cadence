import { getPlaylistItems } from '../../lib/jellyfinPlaylists';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/**
 * A tiny localStorage cache of playlist track lists. Playlist contents change
 * rarely but are expensive to fetch (a large playlist is a big read over the
 * Jellyfin tunnel), so we persist the last-seen tracks per playlist and seed the
 * query with them — a previously-opened playlist paints INSTANTLY from disk,
 * then react-query refetches in the background to catch any change.
 *
 * Survives reloads/app restarts (unlike the in-memory query cache). Bounded so
 * it can't grow without limit; oldest entries evicted first.
 */
const KEY = 'cadence.playlist-items';
const MAX_PLAYLISTS = 30;

type Cache = Record<string, { at: number; tracks: JellyfinItem[] }>;

function read(): Cache {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Cache) : {};
  } catch {
    return {};
  }
}

/** Cached tracks for a playlist, or undefined when not cached. */
export function getCachedPlaylistItems(playlistId: string): JellyfinItem[] | undefined {
  return read()[playlistId]?.tracks;
}

/** Fetch a playlist's tracks and persist them (the query fn for usePlaylistItems). */
export async function fetchAndCachePlaylistItems(playlistId: string): Promise<JellyfinItem[]> {
  const tracks = await getPlaylistItems(playlistId);
  setCachedPlaylistItems(playlistId, tracks);
  return tracks;
}

/** Persist a playlist's tracks, evicting the oldest entries past the cap. */
export function setCachedPlaylistItems(playlistId: string, tracks: JellyfinItem[]): void {
  try {
    const cache = read();
    cache[playlistId] = { at: Date.now(), tracks };
    const ids = Object.keys(cache);
    if (ids.length > MAX_PLAYLISTS) {
      ids
        .sort((a, b) => cache[a].at - cache[b].at)
        .slice(0, ids.length - MAX_PLAYLISTS)
        .forEach((id) => delete cache[id]);
    }
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    /* storage full/unavailable — the in-memory query cache still applies */
  }
}
