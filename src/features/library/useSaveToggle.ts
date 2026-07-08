import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addFavorite, removeFavorite } from '../../lib/jellyfinItems';
import { SAVED_ALBUMS_KEY } from './libraryApi';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/**
 * Save/unsave a collection (album or artist) to the library — Jellyfin
 * favorites work on any item, so this reuses addFavorite/removeFavorite.
 * Seeds from UserData.IsFavorite, flips optimistically, invalidates the
 * saved-albums list.
 */
export function useSaveToggle(item: JellyfinItem | null) {
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(!!item?.UserData?.IsFavorite);

  const mutation = useMutation({
    mutationFn: (next: boolean) =>
      next ? addFavorite(item?.Id ?? '') : removeFavorite(item?.Id ?? ''),
    onMutate: (next: boolean) => setSaved(next),
    onError: (_e, next) => setSaved(!next), // roll back
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SAVED_ALBUMS_KEY }),
  });

  return { saved, toggle: () => mutation.mutate(!saved), busy: mutation.isPending };
}
