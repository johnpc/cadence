import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addFavorite, removeFavorite } from '../../lib/jellyfinItems';
import { LIKED_SONGS_KEY } from './libraryApi';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/**
 * Like/unlike a track. Seeds from the item's UserData.IsFavorite, flips
 * optimistically, and invalidates the liked-songs list so it re-fetches.
 */
export function useLikeToggle(track: JellyfinItem) {
  const queryClient = useQueryClient();
  const [liked, setLiked] = useState(!!track.UserData?.IsFavorite);

  const mutation = useMutation({
    mutationFn: (next: boolean) => (next ? addFavorite(track.Id) : removeFavorite(track.Id)),
    onMutate: (next: boolean) => setLiked(next),
    onError: (_e, next) => setLiked(!next), // roll back
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LIKED_SONGS_KEY }),
  });

  return { liked, toggle: () => mutation.mutate(!liked), busy: mutation.isPending };
}
