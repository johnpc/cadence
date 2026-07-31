/** The subset of Lidarr's API we consume, hand-modelled (no `any`). Lidarr is
 * the "request missing music" backend — music's Radarr — reached via the
 * same-origin /api/lidarr proxy (see deploy/runtime-config.sh). */

/** An artist as Lidarr returns it (search results + after add). */
export interface LidarrArtist {
  id?: number; // present once added to Lidarr
  artistName: string;
  foreignArtistId: string; // MusicBrainz id
  overview?: string;
  remotePoster?: string;
  monitored?: boolean;
}

/** A `/search` result row: an artist OR an album match from MusicBrainz. */
export interface LidarrSearchResult {
  foreignId: string;
  artist?: LidarrArtist;
  album?: { title: string; foreignAlbumId: string; artist?: LidarrArtist };
}

/** A Lidarr id+name option (quality profile, metadata profile, root folder). */
export interface LidarrOption {
  id: number;
  name?: string;
  path?: string;
}

/** The defaults needed to add an artist: where to store + which profiles. */
export interface LidarrAddDefaults {
  rootFolderPath: string;
  qualityProfileId: number;
  metadataProfileId: number;
}

/** A row from Lidarr's download queue — an in-progress grab. `size`/`sizeleft`
 * give a percentage; `title` is the release name; `status` +
 * `trackedDownloadState` describe where it is (downloading, importing, …). */
export interface LidarrQueueItem {
  id: number;
  title?: string;
  status?: string;
  trackedDownloadState?: string;
  size?: number;
  sizeleft?: number;
  artistId?: number;
  /** Present with `includeArtist=true` — the requested artist (what the user
   * actually asked for), used as the row label instead of the release title. */
  artist?: { artistName?: string };
}

/** A queue row's human-readable state, from Lidarr's status +
 * trackedDownloadState — so a stalled row reads "Paused", not a frozen bar. */
export type DownloadStatus = 'downloading' | 'paused' | 'importing' | 'import failed' | 'completed';

/** The queue as shown to the user: the ARTIST name (what was requested), a
 * human status, a 0–100 progress %, and the raw release title as a subtitle. */
export interface DownloadProgress {
  id: number;
  /** Artist name (falls back to the release title when the artist is absent). */
  title: string;
  /** The raw Lidarr release/torrent name, shown small under the artist. */
  release?: string;
  status: DownloadStatus;
  percent: number;
}
