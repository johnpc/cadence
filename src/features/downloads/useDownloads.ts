import { useEffect, useState } from 'react';
import { readIndex } from './downloadIndex';
import { onDownloadsChange } from './downloadStore';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/**
 * The list of downloaded tracks as reactive state, straight from the local
 * index (no Jellyfin round-trip — the list must render offline). Re-reads on
 * every add/remove so the Downloads screen and any download button stay in sync.
 */
export function useDownloads(): { tracks: JellyfinItem[] } {
  const [tracks, setTracks] = useState<JellyfinItem[]>(readIndex);
  useEffect(() => onDownloadsChange(() => setTracks(readIndex())), []);
  return { tracks };
}
