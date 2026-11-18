import { createStore } from '../../../lib/store';
import * as q from '../queue';
import { setPendingSeek } from '../pendingSeek';
import { createPatch, type EngineCore } from './core';
import { createTrackLoader } from './trackLoader';
import { createStallWatchdog } from './stallWatchdog';
import { bindElementEvents } from './elementEvents';
import { queueCommands } from './queueCommands';
import { transportCommands } from './transportCommands';
import { offlineRecovery } from './offlineRecovery';
import {
  canAdvance,
  endedAction,
  errorAction,
  isCasting,
  nextStatus,
  type ElementEvent,
} from './transitions';
import type { JellyfinItem } from '../../../lib/jellyfinTypes';
import type {
  EngineDeps,
  PlayerEngine,
  PlayerProgress,
  PlayerState,
  TransportStatus,
} from './types';

/**
 * The player: one long-lived audio element, the queue, the modes and the
 * transport, as a plain object that owns ONE state store. Every behaviour is a
 * command or an element event; every decision is a pure function in
 * transitions.ts. React (PlayerProvider) and the OS integrations only subscribe.
 *
 * The invariant this file maintains: the element holds the queue's current
 * track (or nothing) — `sync` after every queue change is the only loader call
 * besides an error reload.
 */
export function createPlayerEngine(deps: EngineDeps): PlayerEngine {
  const { audio } = deps;
  const restored = q.currentTrack(deps.initial.queue);
  const state = createStore<PlayerState>({
    ...deps.initial,
    status: restored ? 'paused' : 'idle',
    intent: false,
    started: false,
    sleep: null,
  });
  const progress = createStore<PlayerProgress>({ position: 0, duration: 0 });
  const get = state.get;
  const patch = createPatch(state);
  const current = () => q.currentTrack(get().queue);

  const loader = createTrackLoader(
    deps,
    () => {
      const { volume, rate } = get();
      audio.volume = volume;
      // defaultPlaybackRate survives the load algorithm; playbackRate does not.
      audio.defaultPlaybackRate = rate;
      audio.playbackRate = rate;
    },
    () => get().intent,
  );
  /** The queue restored at launch loads paused (like Spotify; autoplay is
   * blocked anyway). Consumed by the first real load. */
  let restoring = !!restored;
  let recovery = { trackId: '', attempts: 0 };
  let castTarget: JellyfinItem | null = null;
  let userId = deps.session.userId();

  const stall = createStallWatchdog(
    audio,
    deps.stallTimeoutMs,
    () => get().intent,
    () => recover(),
    deps.log,
  );
  const transition = (status: TransportStatus, change: Partial<PlayerState> = {}) => {
    if (status === 'buffering' && get().status !== 'buffering') stall.arm();
    if (status !== 'buffering') stall.disarm();
    patch({ ...change, status });
  };
  const onElement = (event: ElementEvent, change: Partial<PlayerState> = {}) =>
    transition(
      nextStatus(get().status, event, { paused: audio.paused, hasTrack: !!current() }),
      change,
    );

  const unload = () => {
    loader.forget();
    castTarget = null;
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    progress.set({ position: 0, duration: 0 });
    transition('idle', { intent: false });
  };

  const sync = () => {
    const s = get();
    const track = q.currentTrack(s.queue);
    if (!track) {
      if (loader.loaded() || s.status !== 'idle') unload();
    } else if (isCasting(s.status)) {
      if (castTarget === track) return;
      castTarget = track;
      void deps.cast.load(track).catch(() => undefined);
    } else if (loader.loaded() !== track && deps.session.userId()) {
      // (No session yet = launch: the queue rehydrates instantly but the token
      // arrives asynchronously; a URL built now would carry empty credentials.
      // The session subscription re-runs sync the moment it lands.)
      const autoplay = !restoring;
      restoring = false;
      progress.set({ position: 0, duration: 0 });
      // Starting a track IS the user asking for sound (until they pause).
      if (autoplay) patch({ intent: true });
      loader.load(track, autoplay);
    }
  };

  const core: EngineCore = {
    deps,
    state,
    progress,
    get,
    patch,
    transition,
    setQueue: (queue) => {
      if (queue === get().queue) return;
      patch({ queue });
      deps.persist.queue(queue);
      sync();
    },
    setModes: (change) => {
      patch(change);
      const { shuffle, repeat } = get();
      deps.persist.modes({ shuffle, repeat });
    },
  };
  const queueCmds = queueCommands(core);
  const offline = offlineRecovery(core, queueCmds.jumpTo);
  const transport = transportCommands(core, offline);

  /** The normal path: retry the same track once, then skip, then give up. */
  const retryOrSkip = (s: PlayerState, track: JellyfinItem) => {
    if (recovery.trackId !== track.Id) recovery = { trackId: track.Id, attempts: 0 };
    const canSkip = canAdvance(s.queue, s.repeat);
    const action = errorAction({ started: s.started, attempts: recovery.attempts, canSkip });
    if (action === 'retry') {
      recovery.attempts += 1;
      // The reload restarts the element at 0 — keep the listener's place.
      if (audio.currentTime > 1) setPendingSeek(track.Id, audio.currentTime);
      deps.notify('Trouble playing that — retrying…');
      loader.load(track, true);
    } else if (action === 'skip') {
      deps.notify("Couldn't play that track — skipping.");
      queueCmds.next();
    } else if (action === 'give-up') {
      deps.notify("Couldn't play that track.");
      transition('paused');
    }
  };

  /** A stream that isn't on the device failed and nothing has told us yet
   * whether we're offline: the failure may BE the outage, so ask the server
   * once (briefly) before choosing between "skip to a download" and a retry. */
  let probing = false;
  const probeThenRecover = (track: JellyfinItem) => {
    if (probing) return;
    probing = true;
    void deps.availability.probe().then((reachable) => {
      probing = false;
      const s = get();
      if (q.currentTrack(s.queue)?.Id !== track.Id) return; // the user moved on
      if (!reachable && s.intent) offline.recover();
      else retryOrSkip(s, track);
    });
  };

  /** A load error, or a stall that outlived the watchdog. */
  const recover = () => {
    const s = get();
    const track = q.currentTrack(s.queue);
    if (!track) return;
    if (s.intent && offline.unavailable(track.Id)) return offline.recover();
    if (s.intent && s.started && !deps.availability.downloaded(track.Id))
      return probeThenRecover(track);
    retryOrSkip(s, track);
  };

  const onEnded = () => {
    const s = get();
    const action = endedAction(s);
    if (action === 'sleep') {
      transport.pause();
      transport.armSleep(null);
    } else if (action === 'replay') {
      audio.currentTime = 0;
      void audio.play().catch(() => undefined);
    } else if (action === 'end') {
      deps.notify("You've reached the end of the queue.");
    } else {
      core.setQueue(q.next(s.queue, s.repeat === 'all'));
    }
  };

  const onSession = () => {
    const prev = userId;
    userId = deps.session.userId();
    // Signed out (or the token was confirmed dead): the previous user's playback
    // must not keep going — or resume for whoever signs in next.
    if (prev && !userId) transport.stop();
    else if (!prev && userId) sync();
  };

  const onCast = () => {
    const connected = deps.cast.connected();
    const casting = isCasting(get().status);
    const tv: TransportStatus = deps.cast.playing() ? 'casting' : 'casting-paused';
    if (connected && !casting) {
      // castTrack() connects AND loads the current track — don't load it twice.
      castTarget = current();
      loader.forget();
      transition(tv);
      audio.pause();
    } else if (connected) {
      if (get().status !== tv) transition(tv);
    } else if (!connected && casting) {
      // Cast ended: hand playback back to the phone rather than leave silence.
      castTarget = null;
      restoring = false;
      transition(current() ? 'paused' : 'idle');
      sync();
    }
  };

  return {
    state,
    progress,
    position: () => audio.currentTime,
    ...queueCmds,
    ...transport,
    start() {
      deps.attach();
      const unbind = bindElementEvents(
        audio,
        {
          transport: (event) => onElement(event),
          audible: () => {
            deps.onAudible();
            onElement('play', { intent: true, started: true });
          },
          position: (position) => {
            progress.set({ position, duration: progress.get().duration });
            stall.progressed(position);
          },
          duration: (duration) => progress.set({ position: progress.get().position, duration }),
          ended: onEnded,
          error: recover,
        },
        deps.log,
      );
      const offSession = deps.session.subscribe(onSession);
      const offCast = deps.cast.subscribe(onCast);
      userId = deps.session.userId();
      sync();
      return () => {
        unbind();
        offSession();
        offCast();
        stall.disarm();
        transport.dispose();
      };
    },
  };
}
