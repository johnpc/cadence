import { createStore } from '../../lib/store';

/**
 * Reactive Cast session state: whether we're connected to a receiver, its
 * display name, and whether it is playing. The player engine subscribes to it
 * (hand-off to and from the TV); the Cast button reads it via useCast.
 */
export interface CastState {
  connected: boolean;
  deviceName: string;
  /** Whether the receiver is currently playing (best-effort, for the toggle). */
  playing: boolean;
}

export const castStore = createStore<CastState>({
  connected: false,
  deviceName: '',
  playing: false,
});

export const getCastState = (): CastState => castStore.get();
export const setCastState = (next: CastState): void => castStore.set(next);
export const onCastStateChange = (listener: () => void): (() => void) =>
  castStore.subscribe(listener);
