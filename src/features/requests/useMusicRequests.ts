import { useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDebounced } from '../../lib/useDebounced';
import { useToast } from '../toast/useToast';
import { searchArtists, getAddDefaults, requestArtist, getLibraryArtistIds } from './lidarrApi';
import type { LidarrArtist } from './lidarrTypes';

/** Per-artist request status, keyed by MusicBrainz id, for the Requests screen. */
export type RequestStatus = 'idle' | 'requesting' | 'requested' | 'error';

/** Drives the Requests screen: a debounced Lidarr artist search + a per-artist
 * "request" action that adds the artist to Lidarr (monitored + search). Request
 * status is tracked per foreignArtistId so each row shows its own state. */
export function useMusicRequests() {
  const [query, setQuery] = useState('');
  const debounced = useDebounced(query, 400);
  const toast = useToast();
  const [status, setStatus] = useState<Record<string, RequestStatus>>({});

  const search = useQuery({
    queryKey: ['music-requests', debounced],
    queryFn: () => searchArtists(debounced),
    enabled: debounced.trim().length > 1,
    staleTime: 5 * 60_000,
  });

  // The artists already in the library, so a result you own shows "In library"
  // instead of a Request button that would 400 on a duplicate add.
  const library = useQuery({
    queryKey: ['music-requests', 'library-ids'],
    queryFn: getLibraryArtistIds,
    staleTime: 5 * 60_000,
  });
  const inLibrary = useCallback((id: string) => library.data?.has(id) ?? false, [library.data]);

  const request = useCallback(
    async (artist: LidarrArtist) => {
      const id = artist.foreignArtistId;
      setStatus((s) => ({ ...s, [id]: 'requesting' }));
      try {
        await requestArtist(artist, await getAddDefaults());
        setStatus((s) => ({ ...s, [id]: 'requested' }));
        toast(`Requested ${artist.artistName} — downloading soon`);
      } catch {
        setStatus((s) => ({ ...s, [id]: 'error' }));
        toast(`Couldn't request ${artist.artistName}`);
      }
    },
    [toast],
  );

  return {
    query,
    setQuery,
    results: search.data ?? [],
    isSearching: search.isLoading && debounced.trim().length > 1,
    isError: search.isError,
    status,
    request,
    inLibrary,
  };
}
