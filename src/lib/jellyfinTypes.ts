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
  /** Id whose Primary image represents this item (falls back to Id). */
  AlbumId?: string;
  /** Run time in .NET ticks (10,000 per ms). */
  RunTimeTicks?: number;
  /** True when the current user has favorited it. */
  UserData?: { IsFavorite?: boolean };
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
