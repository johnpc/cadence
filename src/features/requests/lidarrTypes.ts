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
