import { useEffect } from 'react';
import { setLogContext, log } from '../../lib/diagnostics/diagnosticsStore';
import { isIos } from '../../lib/platform';
import { artistLine } from './playerFormat';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** Keep the diagnostics ambient context in sync with the current track, so EVERY
 * logged event (play, pause, toggle, waiting, error…) carries the song title +
 * artist + id + platform — otherwise the logs are just bare categories and hard
 * to correlate to what was playing. Also emits an explicit 'track-change' event
 * with the full metadata when the track changes. */
export function useDiagnosticsContext(current: JellyfinItem | null): void {
  const id = current?.Id;
  useEffect(() => {
    const platform = isIos() ? 'ios' : 'web';
    if (!current) {
      setLogContext({ platform });
      return;
    }
    setLogContext({
      platform,
      trackId: current.Id ?? '',
      title: current.Name ?? '',
      artist: artistLine(current),
    });
    log('track-change', 'now playing', {
      title: current.Name ?? '',
      artist: artistLine(current),
      album: current.Album ?? '',
    });
    // Depend on id (not the object) so it fires once per track, not per re-render.
  }, [id, current]);
}
