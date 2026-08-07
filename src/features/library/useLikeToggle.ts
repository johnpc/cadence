import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addFavorite, removeFavorite } from '../../lib/jellyfinItems';
import { tap } from '../../lib/haptics';
import { useToast } from '../toast/useToast';
import { LIKED_SONGS_KEY } from './libraryApi';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/**
 * Like/unlike any favoritable item (track, audiobook, playlist). Seeds from the
 * item's UserData.IsFavorite, flips optimistically, and invalidates the affected
 * lists so they re-fetch (and re-order). On failure it rolls the heart back AND
 * toasts — otherwise the like silently reverts and the user can't tell whether it
 * worked. `extraKeys` lets a caller refresh its own list too (e.g. playlists).
 */
export function useLikeToggle(track: JellyfinItem, extraKeys: readonly unknown[][] = []) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [liked, setLiked] = useState(!!track.UserData?.IsFavorite);

  // Re-seed when the track changes: the mini-player and full-player keep one
  // LikeButton mounted across track changes, so without this the heart would
  // keep showing the FIRST track's liked state for every song after it.
  useEffect(() => {
    setLiked(!!track.UserData?.IsFavorite);
  }, [track.Id, track.UserData?.IsFavorite]);

  const mutation = useMutation({
    mutationFn: (next: boolean) => (next ? addFavorite(track.Id) : removeFavorite(track.Id)),
    onMutate: (next: boolean) => setLiked(next),
    onError: (_e, next) => {
      setLiked(!next); // roll back
      toast(next ? "Couldn't save to Liked Songs" : "Couldn't remove from Liked Songs");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LIKED_SONGS_KEY });
      // A liked item may be an audiobook — refresh the audiobook favorites +
      // library so the "favorites" section reflects the heart immediately (it
      // otherwise stayed cached until an app reload). Harmless for plain tracks:
      // those queries simply aren't mounted / re-fetch cheaply.
      queryClient.invalidateQueries({ queryKey: ['audiobooks-favorites'] });
      queryClient.invalidateQueries({ queryKey: ['audiobooks'] });
      // Caller-supplied lists (e.g. the playlists list, so a hearted playlist
      // re-orders to the top immediately instead of after a reload).
      for (const key of extraKeys) queryClient.invalidateQueries({ queryKey: key });
    },
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
