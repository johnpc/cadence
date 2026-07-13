import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { getItem } from '../../lib/jellyfinItems';
import { fetchAndCacheArtistAlbums } from '../artist/artistApi';
import { fetchAndCacheAlbumTracks } from '../album/albumApi';
import { fetchAndCachePlaylistItems } from '../playlists/playlistItemsCache';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** Warm a detail page's queries when the user hovers OR starts tapping its card,
 * so the page paints from cache on navigation (Spotify-style instant nav). Uses
 * the SAME cache-persisting fetchers + query keys as the detail hooks, so a warm
 * hit also lands on disk and survives reload. A no-op for song/other types
 * (cheap or already cached). Deduped + staleTime-guarded by react-query, so
 * repeated hovers/taps cost nothing. */
export function usePrefetchItem() {
  const qc = useQueryClient();
  return useCallback(
    (item: JellyfinItem) => {
      const opts = { staleTime: 5 * 60_000 };
      // Seed the header query with the item we ALREADY hold (name, art, artist)
      // so the detail header paints INSTANTLY on tap — no blank 3-5s while
      // getItem cold-fetches — then refetch in the background to enrich
      // (Overview/Genres the shelf item may lack). This is the big perceived win.
      const header = (key: string) => {
        qc.setQueryData([key, item.Id], (prev: JellyfinItem | undefined) => prev ?? item);
        void qc.prefetchQuery({
          queryKey: [key, item.Id],
          queryFn: () => getItem(item.Id),
          staleTime: 0,
        });
      };
      if (item.Type === 'MusicAlbum') {
        header('album');
        void qc.prefetchQuery({
          queryKey: ['album-tracks', item.Id],
          queryFn: () => fetchAndCacheAlbumTracks(item.Id),
          ...opts,
        });
      } else if (item.Type === 'MusicArtist') {
        header('artist');
        void qc.prefetchQuery({
          queryKey: ['artist-albums', item.Id],
          queryFn: () => fetchAndCacheArtistAlbums(item.Id),
          ...opts,
        });
      } else if (item.Type === 'Playlist') {
        header('playlist');
        void qc.prefetchQuery({
          queryKey: ['playlist-items', item.Id],
          queryFn: () => fetchAndCachePlaylistItems(item.Id),
          ...opts,
        });
      }
    },
    [qc],
  );
}
