import {
  useLatestAlbums,
  useSuggestedSongs,
  useRecentlyPlayed,
  useOnRepeat,
  usePublicPlaylists,
} from './homeApi';
import { useJumpBackIn } from './useJumpBackIn';
import { useSavedAlbums, useFollowedArtists } from '../library/libraryApi';

/** The Home recommendation shelves' data. Grouped so Home.tsx stays a thin page
 * shell (and the pull-to-refresh can refetch them all at once). */
export function useHomeShelves() {
  const albums = useLatestAlbums();
  const suggested = useSuggestedSongs();
  const saved = useSavedAlbums();
  const recent = useRecentlyPlayed();
  const onRepeat = useOnRepeat();
  const artists = useFollowedArtists();
  const jumpBackIn = useJumpBackIn();
  const community = usePublicPlaylists();
  return { albums, suggested, saved, recent, onRepeat, artists, jumpBackIn, community };
}
