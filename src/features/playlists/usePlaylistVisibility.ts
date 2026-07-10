import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPlaylistIsPublic, setPlaylistIsPublic } from '../../lib/jellyfinPlaylists';
import { PLAYLISTS_KEY } from './playlistsApi';
import { useToast } from '../toast/useToast';

const key = (id: string) => ['playlist-visibility', id];

/**
 * Read + toggle a playlist's public/private visibility (owner-only). Public =
 * shows in the community shelf and others can clone it; private = only the
 * owner's library. `enabled` gates the read to owned playlists (the endpoint
 * throws for non-owners). Toggling optimistically flips the cached value,
 * rolls back + toasts on failure, and refreshes the library/community lists.
 */
export function usePlaylistVisibility(playlistId: string, enabled: boolean) {
  const queryClient = useQueryClient();
  const toast = useToast();

  const q = useQuery({
    queryKey: key(playlistId),
    queryFn: () => getPlaylistIsPublic(playlistId),
    enabled,
    staleTime: 60_000,
  });

  const mutation = useMutation({
    mutationFn: (next: boolean) => setPlaylistIsPublic(playlistId, next),
    onMutate: (next: boolean) => {
      queryClient.setQueryData(key(playlistId), next);
    },
    onError: (_e, next) => {
      queryClient.setQueryData(key(playlistId), !next); // roll back
      toast(next ? "Couldn't make it public" : "Couldn't make it private");
    },
    onSuccess: (_r, next) => {
      toast(next ? 'Playlist is public' : 'Playlist is private');
      void queryClient.invalidateQueries({ queryKey: PLAYLISTS_KEY });
      void queryClient.invalidateQueries({ queryKey: ['home', 'public-playlists'] });
    },
  });

  return {
    isPublic: q.data ?? false,
    isLoading: q.isLoading,
    setPublic: (next: boolean) => mutation.mutate(next),
    busy: mutation.isPending,
  };
}
