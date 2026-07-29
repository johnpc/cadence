import type { JellyfinItem } from '../../lib/jellyfinTypes';
import type { OfflinePlaylist } from './offlinePlaylistStore';

/** One browsable group of downloaded tracks (album / artist / playlist). */
export interface OfflineGroup {
  id: string;
  title: string;
  subtitle: string;
  tracks: JellyfinItem[];
  /** Representative item for art (usually the first track). */
  art: JellyfinItem;
  /** Render a round tile (artists) vs square (albums/playlists). */
  round: boolean;
}

const plural = (n: number, one: string): string => `${n} ${n === 1 ? one : one + 's'}`;

/** Group downloaded tracks by a key, preserving first-seen order (skips undefined keys). */
function groupBy(
  tracks: JellyfinItem[],
  keyOf: (t: JellyfinItem) => string | undefined,
): Map<string, JellyfinItem[]> {
  const groups = new Map<string, JellyfinItem[]>();
  for (const t of tracks) {
    const key = keyOf(t);
    if (!key) continue;
    const list = groups.get(key);
    if (list) list.push(t);
    else groups.set(key, [t]);
  }
  return groups;
}

/** Downloaded music grouped into albums (by AlbumId, else Album name). */
export function toAlbums(music: JellyfinItem[]): OfflineGroup[] {
  const groups = groupBy(music, (t) => t.AlbumId || t.Album);
  return Array.from(groups.values()).map((tracks) => ({
    id: tracks[0].AlbumId || `album:${tracks[0].Album}`,
    title: tracks[0].Album || 'Unknown album',
    subtitle: plural(tracks.length, 'song'),
    tracks,
    art: tracks[0],
    round: false,
  }));
}

/** Downloaded music grouped into artists (by primary ArtistItems id, else name). */
export function toArtists(music: JellyfinItem[]): OfflineGroup[] {
  const groups = groupBy(music, (t) => t.ArtistItems?.[0]?.Id || t.AlbumArtist || t.Artists?.[0]);
  return Array.from(groups.values()).map((tracks) => {
    const first = tracks[0];
    const name = first.ArtistItems?.[0]?.Name || first.AlbumArtist || first.Artists?.[0];
    return {
      id: first.ArtistItems?.[0]?.Id || `artist:${name}`,
      title: name || 'Unknown artist',
      subtitle: plural(tracks.length, 'song'),
      tracks,
      art: first,
      round: true,
    };
  });
}

/** Saved playlists whose tracks are (partly) downloaded → playable offline groups. */
export function toPlaylists(music: JellyfinItem[], saved: OfflinePlaylist[]): OfflineGroup[] {
  const byId = new Map(music.map((t) => [t.Id, t]));
  return saved
    .map((pl) => ({
      id: pl.id,
      title: pl.name,
      tracks: pl.trackIds.map((id) => byId.get(id)).filter((t): t is JellyfinItem => !!t),
    }))
    .filter((pl) => pl.tracks.length > 0)
    .map((pl) => ({
      ...pl,
      subtitle: plural(pl.tracks.length, 'song'),
      art: pl.tracks[0],
      round: false,
    }));
}
