import { useEffect, useState } from 'react';
import { downloadTrack, removeDownload, onDownloadsChange } from './downloadStore';
import { indexedIds } from './downloadIndex';
import { mapLimit } from './mapLimit';
import { tap } from '../../lib/haptics';
import { useToast } from '../toast/useToast';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

export type CollectionState = 'none' | 'partial' | 'downloading' | 'downloaded';

/** How many of `tracks` are already downloaded. */
function downloadedCount(tracks: JellyfinItem[]): number {
  const ids = indexedIds();
  return tracks.filter((t) => ids.has(t.Id)).length;
}

/**
 * Download (or remove) a whole collection — album, playlist, likes — in one tap.
 * Derives its state from how many of the collection's tracks are in the index,
 * so it stays correct even if individual rows were downloaded one-by-one. While
 * a batch runs it reports {done,total} progress. Failures don't abort the batch.
 */
export function useDownloadCollection(tracks: JellyfinItem[]) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(0);
  const [have, setHave] = useState(() => downloadedCount(tracks));
  useEffect(() => onDownloadsChange(() => setHave(downloadedCount(tracks))), [tracks]);

  const total = tracks.length;
  const state: CollectionState = busy
    ? 'downloading'
    : have === 0
      ? 'none'
      : have >= total
        ? 'downloaded'
        : 'partial';

  const downloadAll = async () => {
    tap();
    setBusy(true);
    setDone(0);
    const missing = tracks.filter((t) => !indexedIds().has(t.Id));
    let ok = 0;
    await mapLimit(
      missing,
      3,
      (t) => downloadTrack(t),
      (good) => {
        if (good) ok++;
        setDone((d) => d + 1);
      },
    );
    setBusy(false);
    toast(ok === missing.length ? 'Downloaded' : `Downloaded ${ok} of ${missing.length}`);
  };

  const removeAll = async () => {
    tap();
    await mapLimit(tracks, 3, (t) => removeDownload(t.Id));
    toast('Removed downloads');
  };

  return { state, progress: { done, total }, busy, downloadAll, removeAll };
}
