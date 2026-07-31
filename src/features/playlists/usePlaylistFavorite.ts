import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addFavorite, removeFavorite } from '../../lib/jellyfinItems';
import { tap } from '../../lib/haptics';
import { useToast } from '../toast/useToast';
import { PLAYLISTS_KEY } from './playlistsKeys';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/**
 * Heart/unheart a playlist (Jellyfin favorite). Seeds from the playlist's
 * UserData.IsFavorite, flips optimistically, and invalidates the playlists list
 * so Your Library re-sorts (hearted playlists bubble to the top). Rolls the
 * heart back and toasts on failure so a silent revert can't mislead the user.
 */
export function usePlaylistFavorite(playlist: JellyfinItem | null) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [favorite, setFavorite] = useState(!!playlist?.UserData?.IsFavorite);

  // Re-seed when the playlist changes (the header stays mounted across nav).
  useEffect(() => {
    setFavorite(!!playlist?.UserData?.IsFavorite);
  }, [playlist?.Id, playlist?.UserData?.IsFavorite]);

  const mutation = useMutation({
    mutationFn: (next: boolean) =>
      next ? addFavorite(playlist?.Id ?? '') : removeFavorite(playlist?.Id ?? ''),
    onMutate: (next: boolean) => setFavorite(next),
    onError: (_e, next) => {
      setFavorite(!next); // roll back
      toast(next ? "Couldn't favorite playlist" : "Couldn't unfavorite playlist");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PLAYLISTS_KEY });
      if (playlist) queryClient.invalidateQueries({ queryKey: ['playlist', playlist.Id] });
    },
  });

  return {
    favorite,
    toggle: () => {
      if (!playlist) return;
      tap();
      mutation.mutate(!favorite);
    },
    busy: mutation.isPending,
  };
}
