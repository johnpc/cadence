import { useEffect, useRef, type RefObject } from 'react';
import { audioStreamUrl } from '../../lib/jellyfinStream';
import { isDownloaded, localAudioUrl } from '../downloads/downloadStore';
import { getCastState } from '../cast/castStore';
import { castTrack } from '../cast/castController';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/**
 * Points the audio element at the current track and plays on change. A track
 * restored from a previous session (present at first mount) is loaded but left
 * paused — like Spotify, and browsers block autoplay anyway.
 *
 * When casting to a TV the receiver plays instead — the local element stays
 * silent and the track is loaded on the receiver. Otherwise it prefers a
 * locally-downloaded copy (offline) over the network stream; the common case (a
 * non-downloaded track) stays fully SYNCHRONOUS. Only a downloaded track takes
 * the async path to resolve its blob URL; `active` guards against a track change
 * landing after that slower resolve.
 */
export function useTrackLoader(
  ref: RefObject<HTMLAudioElement | null>,
  current?: JellyfinItem,
): void {
  const currentId = current?.Id;
  const skipAutoPlay = useRef(!!currentId);
  useEffect(() => {
    const audio = ref.current;
    if (!audio || !currentId || !current) return;
    let active = true;
    // Casting to a TV: the receiver plays the audio, so keep the local element
    // silent and load the track on the receiver instead (track changes from
    // next/prev/jumpTo flow through here, so they retarget the TV too).
    if (getCastState().connected) {
      audio.pause();
      skipAutoPlay.current = false;
      void castTrack(current).catch(() => undefined);
      return;
    }
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
  }, [currentId, current, ref]);
}
