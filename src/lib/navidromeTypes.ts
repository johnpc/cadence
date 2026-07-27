/**
 * Hand-modeled Navidrome/Subsonic API shapes — only the fields Cadence
 * actually consumes. No `any`.
 */

/** Result of POST /auth/login (Navidrome's native, non-Subsonic sign-in
 * endpoint) — the only call that produces Subsonic credentials rather than
 * consuming them. `subsonicToken` is `md5(password + subsonicSalt)`, computed
 * SERVER-SIDE; Cadence never sees the plaintext password again after this
 * call, and never computes the hash itself. `token` (a JWT) is intentionally
 * unused — see navidromeAuth.ts. */
export interface LoginResponse {
  id: string;
  username: string;
  subsonicSalt: string;
  subsonicToken: string;
  token: string;
}

/** Result of GET /rest/getUser — used only to confirm a stored session is
 * still valid (see navidromeAuth.validateToken). */
export interface NavidromeUser {
  username: string;
}

/** The session Cadence persists + threads into every Subsonic request. Unlike
 * Jellyfin's single bearer token, Subsonic authenticates per-request via
 * `u` (username) + `t` (subsonicToken) + `s` (subsonicSalt) — see
 * navidromeConfig.subsonicAuthParams. This pair never expires (valid until
 * the user's password changes, recomputed fresh server-side on every
 * request, no server-side session state), unlike the JWT `token` above. */
export interface Session {
  username: string;
  userId: string;
  subsonicSalt: string;
  subsonicToken: string;
}

/** A media item (song, album, artist, playlist) — the subset we render. */
export interface MediaItem {
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
  /** True when the current user may act on the item as its owner — for
   * playlists, `owner === session.username` (see navidromeMapper); Navidrome
   * exposes the owner's username directly, unlike Jellyfin. */
  CanDelete?: boolean;
  /** Present on items carrying their own primary image. */
  ImageTags?: { Primary?: string };
  /** The per-entry id of this track WITHIN a playlist (for removal). Subsonic
   * addresses playlist entries by array INDEX, not a stable id, so this holds
   * the stringified index (see navidromeMapper/navidromePlaylists). */
  PlaylistItemId?: string;
}

/** Envelope returned by list endpoints (/Items, /Playlists/{id}/Items, …). */
export interface ItemsResponse {
  Items: MediaItem[];
  TotalRecordCount: number;
}
