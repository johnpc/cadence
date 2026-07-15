import { useEffect, useRef, type RefObject } from 'react';
import { useSyncExternalStore } from 'react';
import { getCastState, onCastStateChange } from '../cast/castStore';
import { castTrack } from '../cast/castController';
import { startPlayback, resolveTrackSrc } from './startPlayback';
import { getSession, onSessionChange } from '../../lib/sessionStore';
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
  /** Bumped by the error handler to force a re-derive + retry of the same track. */
  reloadNonce = 0,
): void {
  const currentId = current?.Id;
  const skipAutoPlay = useRef(!!currentId);
  // Re-run when casting connects/disconnects so playback hands off to/from the TV.
  const casting = useSyncExternalStore(onCastStateChange, () => getCastState().connected);
  // Re-run when the session's userId becomes available: a track restored at launch
  // can load BEFORE the async session is ready, producing a UserId=&api_key= stream
  // URL that fails (code 4). Re-deriving once the session lands fixes that.
  const userId = useSyncExternalStore(onSessionChange, () => getSession()?.userId ?? '');
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
    // Resolve the src (local blob or stream) then play with the iOS-reliable
    // canplay retry + diagnostics — both extracted (startPlayback/resolveTrackSrc)
    // so this effect stays simple. `cleanup` removes the canplay listener on change.
    let cleanup = () => {};
    const isActive = () => active && ref.current === audio;
    void resolveTrackSrc(currentId).then((src) => {
      cleanup = startPlayback(audio, src, currentId, isActive, skipAutoPlay);
    });
    return () => {
      active = false;
      cleanup();
    };
    // userId: a session restored after an initial (session-less) load re-derives
    // the URL. reloadNonce: the error handler forces a re-derive + retry.
  }, [currentId, current, ref, casting, userId, reloadNonce]);
}
