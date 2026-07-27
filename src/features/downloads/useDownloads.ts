import { useEffect, useState } from 'react';
import { readIndex } from './downloadIndex';
import { onDownloadsChange } from './downloadStore';
import type { MediaItem } from '../../lib/navidromeTypes';

/**
 * The list of downloaded tracks as reactive state, straight from the local
 * index (no Navidrome round-trip — the list must render offline). Re-reads on
 * every add/remove so the Downloads screen and any download button stay in sync.
 */
export function useDownloads(): { tracks: MediaItem[] } {
  const [tracks, setTracks] = useState<MediaItem[]>(readIndex);
  useEffect(() => onDownloadsChange(() => setTracks(readIndex())), []);
  return { tracks };
}
