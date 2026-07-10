/**
 * Hand-modeled Jellyfin API shapes — only the fields Cadence actually consumes.
 * We deliberately do NOT pull the heavy @jellyfin/sdk types; this keeps the
 * client thin and the bundle lean. No `any`.
 */

/** Result of POST /Users/AuthenticateByName. */
export interface AuthResult {
  AccessToken: string;
  User: JellyfinUser;
}

export interface JellyfinUser {
  Id: string;
  Name: string;
}

/** The session Cadence persists + threads into every request. */
export interface Session {
  token: string;
  userId: string;
}

/** A media item (song, album, artist, playlist) — the subset we render. */
export interface JellyfinItem {
  Id: string;
  Name: string;
  Type: string;
  /** Track's album title (Audio items). */
  Album?: string;
  /** Primary artist names (Audio / MusicAlbum items). */
  Artists?: string[];
  AlbumArtist?: string;
  /** The track's artists as linkable items ({Id, Name}) — for "go to artist". */
  ArtistItems?: { Id: string; Name: string }[];
  /** Id whose Primary image represents this item (falls back to Id). */
  AlbumId?: string;
  /** Run time in .NET ticks (10,000 per ms). */
  RunTimeTicks?: number;
  /** Track number within its album (Audio items). */
  IndexNumber?: number;
  /** Disc number within a multi-disc album (Audio items). */
  ParentIndexNumber?: number;
  /** Release year (albums). */
  ProductionYear?: number;
  /** Number of child items — e.g. track count for an album; used to classify
   * albums vs EPs vs singles on the artist page. */
  ChildCount?: number;
  /** Genre names (albums/artists). */
  Genres?: string[];
  /** A prose description / bio (artists/albums), when the server has one. */
  Overview?: string;
  /** True when the current user has favorited it. */
  UserData?: { IsFavorite?: boolean };
  /** True when the current user may delete the item — for playlists this holds
   * only for the OWNER, so it's our signal for "this is my playlist" (Jellyfin
   * doesn't expose OwnerUserId on the /Items response). */
  CanDelete?: boolean;
  /** Present on items carrying their own primary image. */
  ImageTags?: { Primary?: string };
  /** The per-entry id of this track WITHIN a playlist (for removal). */
  PlaylistItemId?: string;
}

/** Envelope returned by list endpoints (/Items, /Playlists/{id}/Items, …). */
export interface ItemsResponse {
  Items: JellyfinItem[];
  TotalRecordCount: number;
}
