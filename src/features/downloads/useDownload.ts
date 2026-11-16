import { useSyncExternalStore } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  downloadTrack,
  removeDownload,
  trackDownloadState,
  onDownloadStateChange,
  type DownloadState,
} from './downloadStore';
import { useDownloadProgress } from './useDownloadProgress';
import { tap } from '../../lib/haptics';
import { useToast } from '../toast/useToast';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

export type { DownloadState };

/**
 * Download/remove a single track for offline playback. The state is READ from
 * the shared download stores, not kept per button — so every row/button for the
 * same track agrees, and leaving a screen mid-download and coming back still
 * shows it downloading (a second tap joins the running download). A failure
 * toasts, so it never silently looks done.
 */
export function useDownload(track: JellyfinItem) {
  const toast = useToast();
  const progress = useDownloadProgress(track.Id);
  const state = useSyncExternalStore(
    onDownloadStateChange,
    () => trackDownloadState(track.Id),
    (): DownloadState => 'none',
  );

  const save = useMutation({
    mutationFn: () => downloadTrack(track),
    onError: () => toast("Couldn't download this track"),
  });

  const drop = useMutation({
    mutationFn: () => removeDownload(track.Id),
    onError: () => toast("Couldn't remove this download"),
  });

  return {
    state,
    // Live 0..1 fraction while downloading (undefined otherwise) so a row can
    // show a percent/ring instead of just a spinner.
    progress,
    busy: state === 'downloading' || drop.isPending,
    toggle: () => {
      tap();
      if (state === 'downloaded') drop.mutate();
      else if (state === 'none') save.mutate();
    },
  };
}
