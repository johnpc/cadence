import { useEffect } from 'react';
import { artistLine } from './playerFormat';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const BASE = 'Cadence';

/** Reflect the current track in the browser tab title ("Song · Artist"), like
 * Spotify web. Reverts to the app name when nothing is playing. */
export function useDocumentTitle(current: JellyfinItem | null): void {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (!current) {
      document.title = BASE;
      return;
    }
    const artist = artistLine(current);
    document.title = artist ? `${current.Name} · ${artist}` : current.Name;
    return () => {
      document.title = BASE;
    };
  }, [current]);
}
