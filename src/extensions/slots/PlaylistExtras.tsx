import { DeezerMissingArtists } from '../deezer/DeezerMissingArtists';

/** What extensions add to a playlist page: for a Deezer-imported playlist, the
 * persistent "request these missing artists" list. Renders nothing otherwise. */
export function PlaylistExtras({ playlistId }: { playlistId: string }) {
  return <DeezerMissingArtists playlistId={playlistId} />;
}
