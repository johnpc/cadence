import { useEffect, useRef } from 'react';
import { audioStreamUrl } from '../../lib/jellyfinStream';
import * as q from './queue';

/**
 * Warms the NEXT track so switching to it is near-gapless. A single detached
 * <audio preload="auto"> buffers the upcoming stream (kicking Jellyfin's
 * transcoder awake over the cold tunnel) — it never plays, never touches the
 * main element, and never touches MediaSession, so the iOS lock-screen path is
 * untouched. Only prefetch while actually playing, so a paused/idle queue
 * doesn't waste the tunnel and the transcoder.
 */
export function useNextTrackPrefetch(queue: q.QueueState, wrap: boolean, isPlaying: boolean): void {
  const elRef = useRef<HTMLAudioElement | null>(null);
  const nextId = isPlaying ? q.peekNextId(queue, wrap) : null;

  useEffect(() => {
    if (!nextId) return;
    const el = elRef.current ?? new Audio();
    elRef.current = el;
    el.preload = 'auto';
    el.muted = true;
    // Just RE-POINT src when the target changes — assigning a new src abandons
    // the prior request on its own. The earlier version also did
    // removeAttribute('src')+load() in cleanup, which fired the instant the
    // prefetched track became current — CANCELLING the warm transcode right when
    // the main element was about to request it (Jellyfin ties the transcode job
    // to the connection), defeating the point. Leaving the warm request alone
    // lets the main element pick up the already-spun-up transcode → faster start.
    el.src = audioStreamUrl(nextId);
    el.load();
  }, [nextId]);

  // Release the detached element only when the player unmounts.
  useEffect(
    () => () => {
      const el = elRef.current;
      if (el) {
        el.removeAttribute('src');
        el.load();
      }
    },
    [],
  );
}
