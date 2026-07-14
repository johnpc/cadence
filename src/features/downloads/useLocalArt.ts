import { useEffect, useState } from 'react';
import { isDownloaded, localArtUrl } from './downloadStore';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** The cached-offline cover-art URL for a DOWNLOADED track, or null. Lets art
 * render fully offline (a downloaded track caches its art alongside its audio —
 * see downloadStore.cacheArt). Returns null for non-downloaded items so the
 * caller falls back to the network image URL. Resolves the blob async; `active`
 * guards against a state update after unmount / a fast item change. */
export function useLocalArt(item: JellyfinItem | null): string | null {
  const [url, setUrl] = useState<string | null>(null);
  const id = item?.Id;
  useEffect(() => {
    if (!id || !isDownloaded(id)) {
      setUrl(null);
      return;
    }
    let active = true;
    void localArtUrl(id).then((u) => {
      if (active) setUrl(u);
    });
    return () => {
      active = false;
    };
  }, [id]);
  return url;
}
