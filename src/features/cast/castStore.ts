/**
 * Reactive Cast session state: whether we're connected to a receiver and its
 * display name. Module-scoped + listener-based (mirrors the app's other small
 * stores) so the player and a Cast button stay in sync without prop-drilling.
 */
export interface CastState {
  connected: boolean;
  deviceName: string;
  /** Whether the receiver is currently playing (best-effort, for the toggle). */
  playing: boolean;
}

let state: CastState = { connected: false, deviceName: '', playing: false };
const listeners = new Set<() => void>();

export function getCastState(): CastState {
  return state;
}

export function setCastState(next: CastState): void {
  state = next;
  for (const l of listeners) l();
}

export function onCastStateChange(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
