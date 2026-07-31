import {
  useLatestAlbums,
  useSuggestedSongs,
  useRecentlyPlayed,
  useOnRepeat,
  usePublicPlaylists,
} from './homeApi';
import { useJumpBackIn } from './useJumpBackIn';
import { useSavedAlbums, useFollowedArtists } from '../library/libraryApi';
import { useHomeSource } from './useHomeSource';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** A shelf slice in the shape Home components expect (data + load flags). */
type Shelf<K extends string> = { [P in K]: JellyfinItem[] } & {
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
};

/** Wrap precomputed plugin data as a shelf (already loaded, no error). */
function pluginShelf<K extends string>(
  key: K,
  items: JellyfinItem[],
  refetch: () => void,
): Shelf<K> {
  return { [key]: items, isLoading: false, isError: false, refetch } as Shelf<K>;
}

/** The Home recommendation shelves' data. Grouped so Home.tsx stays a thin page
 * shell (and pull-to-refresh can refetch them all at once).
 *
 * Two sources: when the CadenceConfig plugin advertises the precomputed endpoint
 * (useHomeSource.active) AND its single call succeeds, the album/song shelves are
 * served from that one fast response and their native per-shelf queries are
 * turned OFF. Otherwise (no plugin, or the plugin call errored) the native
 * queries drive every shelf — Home always works, just with more requests.
 *
 * Followed ARTISTS are ALWAYS fetched natively (via the dedicated /Artists
 * endpoint), on both paths: favorite-artist resolution can't be served by the
 * plugin's item query — the generic MusicArtist+IsFavorite filter returns empty
 * on Jellyfin, so the plugin deliberately omits it (see HomeShelvesService). One
 * cheap /Artists call, disk-seeded, keeps the "Your artists" shelf correct. */
export function useHomeShelves() {
  const src = useHomeSource();
  // Use the plugin data only when it actually arrived; on error/absence fall
  // back to native (native stays enabled whenever the fast data isn't present).
  const fast = src.data;
  const native = !fast;

  const albums = useLatestAlbums(native);
  const suggested = useSuggestedSongs(native);
  const saved = useSavedAlbums(native);
  const recent = useRecentlyPlayed(20, native);
  const onRepeat = useOnRepeat(native);
  // Always native — the plugin can't serve favorite artists (see above).
  const artists = useFollowedArtists();
  const jumpBackIn = useJumpBackIn();
  const community = usePublicPlaylists();

  if (fast) {
    const r = src.refetch;
    return {
      albums: pluginShelf('albums', fast.latestAlbums, r),
      suggested: pluginShelf('songs', fast.suggestedSongs, r),
      saved: pluginShelf('albums', fast.savedAlbums, r),
      recent: pluginShelf('songs', fast.recentlyPlayed, r),
      onRepeat: pluginShelf('songs', fast.onRepeat, r),
      artists, // always native
      jumpBackIn,
      community,
    };
  }
  return { albums, suggested, saved, recent, onRepeat, artists, jumpBackIn, community };
}
