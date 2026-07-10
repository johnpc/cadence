import { useMemo, useState } from 'react';
import { useAddToPlaylist } from './playlistsApi';
import { usePlaylistRecommendations } from './recommendationsApi';
import { selectRecommendations } from './recommendations';
import { getDismissedRecs, dismissRec } from './dismissedRecs';
import { useToast } from '../toast/useToast';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** Drives the playlist's "Recommended songs to add" section: fetches a candidate
 * pool, hides tracks already in the playlist / dismissed / just-added, and
 * exposes add + dismiss actions. Dismissing reveals the next unused candidate. */
export function usePlaylistRecs(playlistId: string, existing: JellyfinItem[]) {
  const { candidates, isLoading } = usePlaylistRecommendations(playlistId, existing.length > 0);
  const add = useAddToPlaylist();
  const toast = useToast();
  const [hidden, setHidden] = useState<string[]>(() => getDismissedRecs(playlistId));

  const existingIds = useMemo(() => new Set(existing.map((t) => t.Id)), [existing]);
  const recommendations = useMemo(
    () => selectRecommendations(candidates, existingIds, new Set(hidden)),
    [candidates, existingIds, hidden],
  );

  const addRec = (track: JellyfinItem) => {
    setHidden((h) => [...h, track.Id]);
    add.mutate(
      { playlistId, itemId: track.Id },
      {
        onSuccess: () => toast('Added to playlist'),
        onError: () => {
          setHidden((h) => h.filter((id) => id !== track.Id)); // restore — add failed
          toast("Couldn't add to playlist");
        },
      },
    );
  };

  const dismissRecommendation = (track: JellyfinItem) => {
    dismissRec(playlistId, track.Id);
    setHidden((h) => [...h, track.Id]);
  };

  return { recommendations, isLoading, addRec, dismissRecommendation };
}
