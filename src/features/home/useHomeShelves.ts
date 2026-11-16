import {
  useLatestAlbums,
  useSuggestedSongs,
  useRecentlyPlayed,
  useOnRepeat,
  usePublicPlaylists,
} from './homeApi';
import { useJumpBackIn } from './useJumpBackIn';
import { useSavedAlbums, useFollowedArtists } from '../library/libraryApi';
import { usePlaylists } from '../playlists/playlistsApi';
import { favoritePlaylists } from './favoritePlaylists';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** A shelf slice in the shape Home components expect (data + load flags). */
type Shelf<K extends string> = { [P in K]: JellyfinItem[] } & {
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
};

/** The Home recommendation shelves' data. Grouped so Home.tsx stays a thin page
 * shell (and pull-to-refresh can refetch them all at once).
 *
 * Every shelf is a native Jellyfin query, fired in parallel the moment Home
 * mounts. (A server plugin used to precompute them; on Jellyfin 12 the native
 * queries are fast enough — 0.1–0.9 s cold on a 30k-song library — and the
 * plugin path made Home wait for the plugin's config before starting at all.) */
export function useHomeShelves() {
  const albums = useLatestAlbums();
  const suggested = useSuggestedSongs();
  const saved = useSavedAlbums();
  const recent = useRecentlyPlayed(20);
  const onRepeat = useOnRepeat();
  const artists = useFollowedArtists();
  const jumpBackIn = useJumpBackIn();
  const community = usePublicPlaylists();
  // Favorited (hearted) playlists: the owned-playlists query already carries
  // UserData.IsFavorite. Shaped as a shelf.
  const pl = usePlaylists();
  const favorites: Shelf<'playlists'> = {
    playlists: favoritePlaylists(pl.playlists),
    isLoading: pl.isLoading,
    isError: pl.isError,
    refetch: () => void pl.refetch(),
  };
  return { albums, suggested, saved, recent, onRepeat, artists, jumpBackIn, community, favorites };
}
