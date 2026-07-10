import { useEffect, useRef, type RefObject } from 'react';
import { audioStreamUrl } from '../../lib/jellyfinStream';
import { isDownloaded, localAudioUrl } from '../downloads/downloadStore';

/**
 * Points the audio element at the current track and plays on change. A track
 * restored from a previous session (present at first mount) is loaded but left
 * paused — like Spotify, and browsers block autoplay anyway.
 *
 * Prefers a locally-downloaded copy (offline playback) over the network stream.
 * The common case — a non-downloaded track — stays fully SYNCHRONOUS (streams
 * immediately). Only a downloaded track takes the async path to resolve its blob
 * URL from Cache Storage; `active` then guards against a track change landing
 * after that slower resolve.
 */
export function useTrackLoader(ref: RefObject<HTMLAudioElement | null>, currentId?: string): void {
  const skipAutoPlay = useRef(!!currentId);
  useEffect(() => {
    const audio = ref.current;
    if (!audio || !currentId) return;
    let active = true;
    const start = (src: string) => {
      if (!active || ref.current !== audio) return; // track changed mid-resolve
      audio.src = src;
      if (skipAutoPlay.current) {
        skipAutoPlay.current = false;
        return;
      }
      void audio.play().catch(() => undefined);
    };
    if (isDownloaded(currentId)) {
      void localAudioUrl(currentId).then((url) => start(url ?? audioStreamUrl(currentId)));
    } else {
      start(audioStreamUrl(currentId));
    }
    return () => {
      active = false;
    };
  }, [currentId, ref]);
}
