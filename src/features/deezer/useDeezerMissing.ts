import { useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '../toast/useToast';
import { getDeezerSubscription } from './deezerSubscriptionApi';
import { requestMissingArtist } from './requestMissingArtist';
import { deezerImportEnabled } from '../../lib/runtimeConfig';
import type { MissingStatus } from './deezerTypes';

/** Drives the persistent "missing artists" section on a Deezer-mirrored playlist:
 * fetch the subscription's missing artists (recomputed server-side against the
 * library), and let the user request each via Lidarr. Only queries when the plugin
 * exposes Deezer import; a non-Deezer playlist resolves to null (section hidden). */
export function useDeezerMissing(playlistId: string) {
  const toast = useToast();
  const [status, setStatus] = useState<Record<string, MissingStatus>>({});

  const sub = useQuery({
    queryKey: ['deezer-subscription', playlistId],
    queryFn: () => getDeezerSubscription(playlistId),
    enabled: deezerImportEnabled() && playlistId.length > 0,
    staleTime: 60_000,
  });

  const request = useCallback(
    async (artist: string) => {
      setStatus((s) => ({ ...s, [artist]: 'requesting' }));
      try {
        await requestMissingArtist(artist);
        setStatus((s) => ({ ...s, [artist]: 'requested' }));
        toast(`Requested ${artist} — downloading soon`);
      } catch {
        setStatus((s) => ({ ...s, [artist]: 'error' }));
        toast(`Couldn’t request ${artist}`);
      }
    },
    [toast],
  );

  return { missing: sub.data?.MissingArtists ?? [], status, request };
}
