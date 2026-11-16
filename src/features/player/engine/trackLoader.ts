import { startPlayback } from '../startPlayback';
import { armResume } from './audiobookResume';
import type { JellyfinItem } from '../../../lib/jellyfinTypes';
import type { EngineDeps } from './types';

/**
 * Points the one audio element at a track. Each `load` is a new GENERATION: a
 * slower async src (a downloaded track's blob URL) that resolves after a newer
 * load is dropped, and the previous load's canplay-retry + resume listeners are
 * released. `loaded()` is the track object the element holds — compared by
 * identity, exactly like the old effect deps, so re-playing a freshly fetched
 * list restarts it while appending radio to the queue never reloads.
 */
export interface TrackLoader {
  loaded(): JellyfinItem | null;
  load(track: JellyfinItem, autoplay: boolean): void;
  /** Forget the loaded track without touching the element (cast / unload). */
  forget(): void;
}

export function createTrackLoader(
  deps: Pick<EngineDeps, 'audio' | 'resolveSrc' | 'resumeAt' | 'log'>,
  /** Re-apply volume/speed right after a new src (a load resets the element). */
  afterSrc: () => void,
  /** Does the user still want sound? Gates the canplay play() retry. */
  wantsSound: () => boolean,
): TrackLoader {
  const { audio } = deps;
  let loaded: JellyfinItem | null = null;
  let generation = 0;
  let release: Array<() => void> = [];
  const releaseAll = () => {
    release.forEach((fn) => fn());
    release = [];
  };

  const begin = (track: JellyfinItem, src: string, autoplay: boolean, mine: number) => {
    const isActive = () => mine === generation;
    if (!isActive()) return;
    release.push(
      startPlayback(audio, src, track.Id, isActive, { current: !autoplay }, deps.log, wantsSound),
    );
    afterSrc();
    release.push(armResume(audio, track, isActive, deps.resumeAt, deps.log));
  };

  return {
    loaded: () => loaded,
    load(track, autoplay) {
      releaseAll();
      loaded = track;
      const mine = ++generation;
      const src = deps.resolveSrc(track.Id);
      if (typeof src === 'string') begin(track, src, autoplay, mine);
      else
        void src.then(
          (resolved) => begin(track, resolved, autoplay, mine),
          () => undefined,
        );
    },
    forget() {
      releaseAll();
      loaded = null;
      generation++;
    },
  };
}
