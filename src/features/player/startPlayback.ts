import { audioStreamUrl } from '../../lib/jellyfinStream';
import { isDownloaded, localAudioUrl } from '../downloads/downloadStore';
import type { AudioLike, LogFn } from './engine/types';

/** Resolve the best src for a track: a locally-downloaded blob when present
 * (offline), else the Jellyfin network stream. Only the downloaded case is
 * async — the common streaming path returns a plain string so the engine sets
 * src and calls play() in the same task as the user's tap (iOS only honours
 * play() inside the gesture). */
export function resolveTrackSrc(id: string): string | Promise<string> {
  if (!isDownloaded(id)) return audioStreamUrl(id);
  return localAudioUrl(id).then((url) => url ?? audioStreamUrl(id));
}

/** Point the element at `src` and play, with the reliability + diagnostics the
 * iOS WKWebView needs.
 *
 * - `isActive()` guards against a track change landing mid-resolve.
 * - `skipAutoPlay` (a ref-like box) leaves a session-restored first track paused.
 * - A rejected play() (WKWebView "interrupted by a new load request") is retried
 *   on the FIRST `canplay` only, and logged — the "songs are tricky to start" fix.
 *
 * Returns a cleanup that removes the canplay listener.
 */
export function startPlayback(
  audio: AudioLike,
  src: string,
  currentId: string,
  isActive: () => boolean,
  skipAutoPlay: { current: boolean },
  log: LogFn,
  /** Does the user still want sound? A pause before the first canplay wins. */
  wantsSound: () => boolean = () => true,
): () => void {
  if (!isActive()) return () => {};
  audio.src = src;
  // Reset to the start of the NEW track. Assigning `src` does not reliably zero
  // currentTime on every engine (notably the iOS WKWebView, where the prior
  // track's position can persist until the new metadata loads) — a stale
  // position past the new (shorter) track's duration makes it fire `ended`
  // immediately, so the next song "starts at the end" and skips instead of
  // playing. The audiobook-resume hook still seeks afterward (it only resumes
  // when currentTime <= 1, which this guarantees).
  audio.currentTime = 0;
  log('track-load', 'set src', { id: currentId, local: String(src.startsWith('blob:')) });
  if (skipAutoPlay.current) {
    skipAutoPlay.current = false;
    return () => {};
  }
  // ONE-SHOT: only the first canplay after this load may retry. It used to stay
  // attached for the whole track, so a later canplay (after a seek or a stall)
  // restarted a track the user had deliberately paused — and even this first
  // one yields to a pause the user made before the stream was ready.
  const onCanPlay = () => {
    audio.removeEventListener('canplay', onCanPlay);
    if (isActive() && audio.paused && wantsSound()) void audio.play().catch(() => undefined);
  };
  audio.addEventListener('canplay', onCanPlay);
  void audio.play().catch((e: unknown) => {
    log('play-rejected', 'play() rejected', {
      id: currentId,
      reason: e instanceof Error ? e.name : 'unknown',
    });
  });
  return () => audio.removeEventListener('canplay', onCanPlay);
}
