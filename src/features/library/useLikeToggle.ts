import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addFavorite, removeFavorite } from '../../lib/jellyfinItems';
import { tap } from '../../lib/haptics';
import { useToast } from '../toast/useToast';
import { LIKED_SONGS_KEY } from './libraryApi';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/**
 * Like/unlike a track. Seeds from the item's UserData.IsFavorite, flips
 * optimistically, and invalidates the liked-songs list so it re-fetches. On
 * failure it rolls the heart back AND toasts — otherwise the like silently
 * reverts and the user can't tell whether it worked.
 */
export function useLikeToggle(track: JellyfinItem) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [liked, setLiked] = useState(!!track.UserData?.IsFavorite);

  const mutation = useMutation({
    mutationFn: (next: boolean) => (next ? addFavorite(track.Id) : removeFavorite(track.Id)),
    onMutate: (next: boolean) => setLiked(next),
    onError: (_e, next) => {
      setLiked(!next); // roll back
      toast(next ? "Couldn't save to Liked Songs" : "Couldn't remove from Liked Songs");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LIKED_SONGS_KEY }),
  });

  return {
    liked,
    toggle: () => {
      tap();
      mutation.mutate(!liked);
    },
    busy: mutation.isPending,
  };
}
