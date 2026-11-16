import { watch } from '../../../lib/store';
import { currentTrack } from '../queue';
import { artistLine } from '../playerFormat';
import type { PlayerEngine } from '../engine/types';

const BASE = 'Cadence';

/** Reflect the playing track in the tab title ("Song · Artist"), like Spotify
 * web; the app name when nothing is loaded. */
export function attachDocumentTitle(engine: Pick<PlayerEngine, 'state'>): () => void {
  const off = watch(
    engine.state,
    (s) => currentTrack(s.queue),
    (track) => {
      if (!track) {
        document.title = BASE;
        return;
      }
      const artist = artistLine(track);
      document.title = artist ? `${track.Name} · ${artist}` : track.Name;
    },
    { immediate: true },
  );
  return () => {
    off();
    document.title = BASE;
  };
}
