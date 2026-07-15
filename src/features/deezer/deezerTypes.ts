/** Shapes for the Deezer playlist import (the CadenceConfig plugin's
 * POST /Cadence/Deezer/Import). The plugin reads a public Deezer playlist, matches
 * its tracks against the user's Jellyfin library, creates a playlist of the ones
 * found, and reports the artists whose tracks are missing so we can offer to
 * request them via Lidarr. Keys are PascalCase — the plugin serialises .NET. */
export interface DeezerImportResult {
  /** The created Jellyfin playlist's id. */
  PlaylistId: string;
  /** The playlist name (mirrors the Deezer playlist title). */
  PlaylistName: string;
  /** How many library tracks were matched and added to the playlist. */
  AddedCount: number;
  /** Total tracks in the source Deezer playlist. */
  TotalCount: number;
  /** Distinct artists whose tracks aren't in the library yet (Lidarr candidates). */
  MissingArtists: string[];
}

/** Per-artist request status on the import result screen, keyed by artist name. */
export type MissingStatus = 'idle' | 'requesting' | 'requested' | 'error';
