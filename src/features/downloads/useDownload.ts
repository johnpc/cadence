import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { downloadTrack, removeDownload, isDownloaded } from './downloadStore';
import { tap } from '../../lib/haptics';
import { useToast } from '../toast/useToast';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

export type DownloadState = 'none' | 'downloading' | 'downloaded';

/**
 * Download/remove a single track for offline playback. Seeds from the store's
 * current state, flips optimistically to 'downloading' while the audio fetch is
 * in flight, and toasts + rolls back on failure — otherwise a failed download
 * would silently look done. Mirrors useLikeToggle.
 */
export function useDownload(track: JellyfinItem) {
  const toast = useToast();
  const [state, setState] = useState<DownloadState>(() =>
    isDownloaded(track.Id) ? 'downloaded' : 'none',
  );

  const save = useMutation({
    mutationFn: () => downloadTrack(track),
    onMutate: () => setState('downloading'),
    onError: () => {
      setState('none');
      toast("Couldn't download this track");
    },
    onSuccess: () => setState('downloaded'),
  });

  const drop = useMutation({
    mutationFn: () => removeDownload(track.Id),
    onSuccess: () => setState('none'),
    onError: () => toast("Couldn't remove this download"),
  });

  return {
    state,
    busy: save.isPending || drop.isPending,
    toggle: () => {
      tap();
      if (state === 'downloaded') drop.mutate();
      else if (state === 'none') save.mutate();
    },
  };
}
