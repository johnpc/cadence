import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addFavorite, removeFavorite } from '../../lib/jellyfinItems';
import { useToast } from '../toast/useToast';
import { SAVED_ALBUMS_KEY, FOLLOWED_ARTISTS_KEY } from './libraryApi';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/**
 * Save/unsave a collection (album or artist) to the library — Jellyfin
 * favorites work on any item, so this reuses addFavorite/removeFavorite.
 * Seeds from UserData.IsFavorite, flips optimistically, invalidates the
 * saved-albums list. On failure it rolls back AND toasts (no silent revert).
 */
export function useSaveToggle(item: JellyfinItem | null) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [saved, setSaved] = useState(!!item?.UserData?.IsFavorite);

  const mutation = useMutation({
    mutationFn: (next: boolean) =>
      next ? addFavorite(item?.Id ?? '') : removeFavorite(item?.Id ?? ''),
    onMutate: (next: boolean) => setSaved(next),
    onError: (_e, next) => {
      setSaved(!next); // roll back
      toast(next ? "Couldn't add to your library" : "Couldn't remove from your library");
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SAVED_ALBUMS_KEY });
      void queryClient.invalidateQueries({ queryKey: FOLLOWED_ARTISTS_KEY });
    },
  });

  return { saved, toggle: () => mutation.mutate(!saved), busy: mutation.isPending };
}
