import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { getItem, getItemTracks } from '../../lib/jellyfinItems';
import { getArtistAlbums } from '../../lib/jellyfinArtists';
import { getPlaylistItems } from '../../lib/jellyfinPlaylists';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** Warm a detail page's queries when the user hovers its card, so the page
 * paints from cache on click (Spotify-style instant navigation). Mirrors the
 * query keys used by album/artist detail hooks; a no-op for song/other types
 * (their detail data is cheap or already cached). Deduped + staleTime-guarded
 * by react-query, so repeated hovers cost nothing. */
export function usePrefetchItem() {
  const qc = useQueryClient();
  return useCallback(
    (item: JellyfinItem) => {
      const opts = { staleTime: 60_000 };
      if (item.Type === 'MusicAlbum') {
        void qc.prefetchQuery({
          queryKey: ['album', item.Id],
          queryFn: () => getItem(item.Id),
          ...opts,
        });
        void qc.prefetchQuery({
          queryKey: ['album-tracks', item.Id],
          queryFn: () => getItemTracks(item.Id),
          ...opts,
        });
      } else if (item.Type === 'MusicArtist') {
        void qc.prefetchQuery({
          queryKey: ['artist', item.Id],
          queryFn: () => getItem(item.Id),
          ...opts,
        });
        void qc.prefetchQuery({
          queryKey: ['artist-albums', item.Id],
          queryFn: () => getArtistAlbums(item.Id),
          ...opts,
        });
      } else if (item.Type === 'Playlist') {
        // Playlist detail loads its header (['playlist', id]) + tracks
        // (['playlist-items', id]) — warm both so a tap paints from cache
        // instead of the long cold fetch John saw.
        void qc.prefetchQuery({
          queryKey: ['playlist', item.Id],
          queryFn: () => getItem(item.Id),
          ...opts,
        });
        void qc.prefetchQuery({
          queryKey: ['playlist-items', item.Id],
          queryFn: () => getPlaylistItems(item.Id),
          ...opts,
        });
      }
    },
    [qc],
  );
}
