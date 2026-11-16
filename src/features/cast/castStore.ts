import { createStore } from '../../lib/store';

/**
 * The Cast session as ONE explicit state:
 * - `off`        no session.
 * - `connecting` the device picker / handshake is in progress.
 * - `connected`  a receiver owns playback; `playing` is whether the TV is playing.
 * - `lost`       the session ended without the user stopping it (Wi-Fi dropped,
 *                the TV switched off). Shown briefly, then back to `off`.
 * The player engine subscribes (hand-off to and from the TV); the Cast button and
 * banner read it via useCast.
 */
export type CastState =
  | { status: 'off' }
  | { status: 'connecting' }
  | { status: 'connected'; deviceName: string; playing: boolean }
  | { status: 'lost'; deviceName: string };

export const CAST_OFF: CastState = { status: 'off' };

export const castStore = createStore<CastState>(CAST_OFF);

export const getCastState = (): CastState => castStore.get();
export const setCastState = (next: CastState): void => castStore.set(next);
export const onCastStateChange = (listener: () => void): (() => void) =>
  castStore.subscribe(listener);

/** A receiver owns playback right now. */
export const isCastConnected = (s: CastState = getCastState()): boolean => s.status === 'connected';

/** The TV is playing (only ever true while connected). */
export const isCastPlaying = (s: CastState = getCastState()): boolean =>
  s.status === 'connected' && s.playing;
