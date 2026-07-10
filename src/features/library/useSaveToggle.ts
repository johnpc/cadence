import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addFavorite, removeFavorite } from '../../lib/jellyfinItems';
import { tap } from '../../lib/haptics';
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

  // "Follow/Unfollow" reads right for an artist; "library" for albums.
  const isArtist = item?.Type === 'MusicArtist';
  const words = isArtist
    ? {
        done: 'Following',
        undone: 'Unfollowed',
        failAdd: "Couldn't follow",
        failRemove: "Couldn't unfollow",
      }
    : {
        done: 'Saved to library',
        undone: 'Removed from library',
        failAdd: "Couldn't add to your library",
        failRemove: "Couldn't remove from your library",
      };

  const mutation = useMutation({
    mutationFn: (next: boolean) =>
      next ? addFavorite(item?.Id ?? '') : removeFavorite(item?.Id ?? ''),
    onMutate: (next: boolean) => setSaved(next),
    onError: (_e, next) => {
      setSaved(!next); // roll back
      toast(next ? words.failAdd : words.failRemove);
    },
    onSuccess: (_r, next) => {
      toast(next ? words.done : words.undone);
      void queryClient.invalidateQueries({ queryKey: SAVED_ALBUMS_KEY });
      void queryClient.invalidateQueries({ queryKey: FOLLOWED_ARTISTS_KEY });
    },
  });

  return {
    saved,
    toggle: () => {
      tap();
      mutation.mutate(!saved);
    },
    busy: mutation.isPending,
  };
}
