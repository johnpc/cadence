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
import { usePlaylists } from '../playlists/playlistsApi';
import { favoritePlaylists } from './favoritePlaylists';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** A shelf slice in the shape Home components expect (data + load flags). */
type Shelf<K extends string> = { [P in K]: JellyfinItem[] } & {
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
};

/** Wrap plugin fast-path state as a shelf: the precomputed items once they've
 * arrived, or a loading placeholder while the single /Cadence/Home call is still
 * in flight (so Home shows its skeleton, not a false "empty", during the wait). */
function pluginShelf<K extends string>(
  key: K,
  items: JellyfinItem[],
  loading: boolean,
  refetch: () => void,
): Shelf<K> {
  return { [key]: items, isLoading: loading, isError: false, refetch } as Shelf<K>;
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
  const fast = src.data;
  // Only fetch the native shelves when the plugin fast-path is NOT going to
  // provide data: it's disabled (no plugin), or its call errored (e.g. a cold-
  // miss 503). Crucially we do NOT fire native queries merely because the plugin
  // response hasn't arrived YET — that raced ~6 slow native scans against every
  // Home load and defeated the fast-path's whole point. While the plugin query
  // is in flight, native stays OFF and Home paints from the plugin (~50ms warm)
  // the moment it lands; only a real plugin error falls back to native.
  const native = !src.active || src.isError;

  const albums = useLatestAlbums(native);
  const suggested = useSuggestedSongs(native);
  const saved = useSavedAlbums(native);
  const recent = useRecentlyPlayed(20, native);
  const onRepeat = useOnRepeat(native);
  // Always native — the plugin can't serve favorite artists (see above).
  const artists = useFollowedArtists();
  const jumpBackIn = useJumpBackIn();
  const community = usePublicPlaylists();
  // Favorited (hearted) playlists — always native (the owned-playlists query
  // already carries UserData.IsFavorite; no plugin path needed). Shaped as a shelf.
  const pl = usePlaylists();
  const favorites: Shelf<'playlists'> = {
    playlists: favoritePlaylists(pl.playlists),
    isLoading: pl.isLoading,
    isError: pl.isError,
    refetch: () => void pl.refetch(),
  };

  // Plugin fast-path (active + not errored): serve its shelves — the precomputed
  // data once it lands, or a loading placeholder while /Cadence/Home is in flight
  // (native queries stayed OFF, so nothing raced). Only `native` (disabled or
  // errored) falls through to the live per-shelf queries below.
  if (!native) {
    const r = src.refetch;
    const loading = src.isLoading || !fast;
    return {
      albums: pluginShelf('albums', fast?.latestAlbums ?? [], loading, r),
      suggested: pluginShelf('songs', fast?.suggestedSongs ?? [], loading, r),
      saved: pluginShelf('albums', fast?.savedAlbums ?? [], loading, r),
      recent: pluginShelf('songs', fast?.recentlyPlayed ?? [], loading, r),
      onRepeat: pluginShelf('songs', fast?.onRepeat ?? [], loading, r),
      artists, // always native
      jumpBackIn,
      community,
      favorites,
    };
  }
  return { albums, suggested, saved, recent, onRepeat, artists, jumpBackIn, community, favorites };
}
