import { watch } from '../../../lib/store';
import { audioStreamUrl } from '../../../lib/jellyfinStream';
import { peekNextId } from '../queue';
import type { AudioLike, PlayerEngine, PlayerState } from '../engine/types';

/** The track to warm: the next one, only while local audio is running (a paused
 * or casting queue mustn't spend the network and the transcoder). */
const prefetchTarget = (s: PlayerState): string | null =>
  s.status === 'playing' || s.status === 'buffering'
    ? peekNextId(s.queue, s.repeat === 'all')
    : null;

/**
 * Warm the NEXT track so switching to it is near-gapless: a detached, muted
 * `<audio preload="auto">` buffers the upcoming stream (waking Jellyfin's
 * transcoder). It never plays and never touches MediaSession. Re-pointing `src`
 * abandons the previous request on its own — releasing it when the prefetched
 * track became current used to CANCEL the warm transcode right as the main
 * element asked for it.
 */
export function attachNextTrackPrefetch(
  engine: Pick<PlayerEngine, 'state'>,
  createAudio: () => Pick<AudioLike, 'src' | 'load' | 'removeAttribute'> & {
    preload: string;
    muted: boolean;
  } = () => new Audio(),
): () => void {
  let el: ReturnType<typeof createAudio> | null = null;
  const off = watch(
    engine.state,
    prefetchTarget,
    (nextId) => {
      if (!nextId) return;
      el ??= createAudio();
      el.preload = 'auto';
      el.muted = true;
      el.src = audioStreamUrl(nextId);
      el.load();
    },
    { immediate: true },
  );
  return () => {
    off();
    if (!el) return;
    el.removeAttribute('src');
    el.load();
  };
}
