import { log } from '../../lib/diagnostics/diagnosticsStore';
import { audioStreamUrl } from '../../lib/jellyfinStream';
import { isDownloaded, localAudioUrl } from '../downloads/downloadStore';

/** Resolve the best src for a track: a locally-downloaded blob when present
 * (offline), else the Jellyfin network stream. Async only for the downloaded
 * case; the common (streaming) path resolves synchronously. */
export async function resolveTrackSrc(id: string): Promise<string> {
  if (isDownloaded(id)) return (await localAudioUrl(id)) ?? audioStreamUrl(id);
  return audioStreamUrl(id);
}

/** Point the element at `src` and play, with the reliability + diagnostics the
 * iOS WKWebView needs. Extracted from useTrackLoader so the effect stays simple
 * (and this is unit-testable in isolation).
 *
 * - `isActive()` guards against a track change landing mid-resolve.
 * - `skipAutoPlay` (a ref-like box) leaves a session-restored first track paused.
 * - A rejected play() (WKWebView "interrupted by a new load request") is retried
 *   once on `canplay` and logged — the "songs are tricky to start" fix.
 *
 * Returns a cleanup that removes the canplay listener.
 */
export function startPlayback(
  audio: HTMLAudioElement,
  src: string,
  currentId: string,
  isActive: () => boolean,
  skipAutoPlay: { current: boolean },
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
  const onCanPlay = () => {
    if (isActive() && audio.paused) void audio.play().catch(() => undefined);
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
