/**
 * Raw Subsonic/Navidrome wire shapes (JSON, `f=json`) — named to match the
 * spec exactly. Confined to navidromeMapper.ts and the navidrome*.ts lib
 * files that call `request`; never exported to feature code, which only ever
 * sees the mapped `MediaItem` shape (see navidromeTypes.ts).
 */

export interface SubsonicArtistRef {
  id: string;
  name: string;
}

/** A song ("Child" in the spec) — returned by getSong, getAlbum's `song[]`,
 * getSimilarSongs2, getStarred2's `song[]`, search3's `song[]`, etc. */
export interface SubsonicChild {
  id: string;
  title: string;
  album?: string;
  artist?: string;
  albumId?: string;
  artistId?: string;
  /** OpenSubsonic extension — linkable per-artist credits; prefer this over
   * the single `artist` string when present. */
  artists?: SubsonicArtistRef[];
  track?: number;
  discNumber?: number;
  year?: number;
  genre?: string;
  /** OpenSubsonic extension — prefer this over the single `genre` string. */
  genres?: { name: string }[];
  coverArt?: string;
  duration?: number;
  playCount?: number;
  /** Present (an ISO timestamp) when the current user has starred it. */
  starred?: string;
}

/** An album (ID3) — returned by getAlbumList2's `album[]`, search3's
 * `album[]`, getStarred2's `album[]`, getArtist's `album[]`. getAlbum itself
 * returns this SAME shape plus a `song[]` (AlbumWithSongsID3). */
export interface SubsonicAlbum {
  id: string;
  name: string;
  artist?: string;
  artistId?: string;
  artists?: SubsonicArtistRef[];
  coverArt?: string;
  songCount?: number;
  duration?: number;
  playCount?: number;
  created?: string;
  year?: number;
  genre?: string;
  genres?: { name: string }[];
  starred?: string;
  /** Present only on getAlbum's response (AlbumWithSongsID3), not on list
   * endpoints. */
  song?: SubsonicChild[];
}

/** An artist (ID3) — returned by getStarred2's `artist[]`, search3's
 * `artist[]`. getArtist itself returns this SAME shape plus an `album[]`
 * (ArtistWithAlbumsID3). */
export interface SubsonicArtist {
  id: string;
  name: string;
  coverArt?: string;
  albumCount?: number;
  starred?: string;
  /** Present only on getArtist's response (ArtistWithAlbumsID3). */
  album?: SubsonicAlbum[];
}

export interface SubsonicPlaylist {
  id: string;
  name: string;
  comment?: string;
  owner: string;
  public: boolean;
  songCount: number;
  duration: number;
  coverArt?: string;
  created: string;
  /** Present only on getPlaylist's response — the tracks, in order. */
  entry?: SubsonicChild[];
}
