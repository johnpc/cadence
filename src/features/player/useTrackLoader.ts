import { useEffect, useRef, type RefObject } from 'react';
import { useSyncExternalStore } from 'react';
import { audioStreamUrl } from '../../lib/jellyfinStream';
import { isDownloaded, localAudioUrl } from '../downloads/downloadStore';
import { getCastState, onCastStateChange } from '../cast/castStore';
import { castTrack } from '../cast/castController';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/**
 * Points the audio element at the current track and plays on change. A track
 * restored from a previous session (present at first mount) is loaded but left
 * paused — like Spotify, and browsers block autoplay anyway.
 *
 * When casting to a TV the receiver plays instead — the local element stays
 * silent and the track is loaded on the receiver. When casting ENDS, the effect
 * re-runs (it depends on the cast-connected flag) and hands playback back to the
 * phone — resuming the current track locally rather than leaving silence.
 * Otherwise it prefers a locally-downloaded copy (offline) over the network
 * stream; the common case (a non-downloaded track) stays fully SYNCHRONOUS. Only
 * a downloaded track takes the async path to resolve its blob URL; `active`
 * guards against a track change landing after that slower resolve.
 */
export function useTrackLoader(
  ref: RefObject<HTMLAudioElement | null>,
  current?: JellyfinItem,
): void {
  const currentId = current?.Id;
  const skipAutoPlay = useRef(!!currentId);
  // Re-run when casting connects/disconnects so playback hands off to/from the TV.
  const casting = useSyncExternalStore(onCastStateChange, () => getCastState().connected);
  const wasCasting = useRef(casting);
  useEffect(() => {
    const audio = ref.current;
    if (!audio || !currentId || !current) return;
    let active = true;
    // Casting to a TV: the receiver plays the audio, so keep the local element
    // silent and load the track on the receiver instead (track changes from
    // next/prev/jumpTo flow through here, so they retarget the TV too).
    if (casting) {
      wasCasting.current = true;
      audio.pause();
      skipAutoPlay.current = false;
      void castTrack(current).catch(() => undefined);
      return;
    }
    // Casting just ended → resume the current track locally (don't leave silence);
    // a plain track/mount change keeps the normal restore-paused behaviour.
    if (wasCasting.current) {
      wasCasting.current = false;
      skipAutoPlay.current = false;
    }
    // iOS/WKWebView can reject the play() that immediately follows a src change
    // with "interrupted by a new load request" (the element is still loading),
    // which the .catch swallowed — the track silently never started (the "songs
    // are tricky to start" symptom). Retry once when the element signals canplay.
    const onCanPlay = () => {
      if (active && ref.current === audio && audio.paused) {
        void audio.play().catch(() => undefined);
      }
    };
    const start = (src: string) => {
      if (!active || ref.current !== audio) return; // track changed mid-resolve
      audio.src = src;
      if (skipAutoPlay.current) {
        skipAutoPlay.current = false;
        return;
      }
      audio.addEventListener('canplay', onCanPlay);
      void audio.play().catch(() => undefined);
    };
    if (isDownloaded(currentId)) {
      void localAudioUrl(currentId).then((url) => start(url ?? audioStreamUrl(currentId)));
    } else {
      start(audioStreamUrl(currentId));
    }
    return () => {
      active = false;
      audio.removeEventListener('canplay', onCanPlay);
    };
  }, [currentId, current, ref, casting]);
}
