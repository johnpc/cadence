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
    el.src = audioStreamUrl(nextId);
    el.load();
    return () => {
      el.removeAttribute('src');
      el.load(); // release the buffered request when the target changes
    };
  }, [nextId]);
}
