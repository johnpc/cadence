import { useSyncExternalStore } from 'react';
import { isDownloaded, onDownloadsChange } from './downloadStore';
import { getProgress, onProgressChange } from './downloadProgress';
import type { BadgeState } from './DownloadBadge';

/**
 * A single track's badge state, derived live from the download index (is it
 * saved?) and the ephemeral progress store (is it mid-download, and how far?).
 * Subscribes to both so a row's badge updates as a download starts, progresses,
 * and completes — without the row needing the useDownload mutation machinery.
 */
export function useTrackBadge(id: string): BadgeState {
  const downloaded = useSyncExternalStore(
    onDownloadsChange,
    () => isDownloaded(id),
    () => false,
  );
  const fraction = useSyncExternalStore(
    onProgressChange,
    () => getProgress(id),
    () => undefined,
  );
  if (downloaded) return { status: 'downloaded' };
  if (fraction !== undefined) return { status: 'downloading', fraction };
  return { status: 'none' };
}
