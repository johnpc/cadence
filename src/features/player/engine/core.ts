import type { Store } from '../../../lib/store';
import type { QueueState } from '../queue';
import type { EngineDeps, PlayerProgress, PlayerState, TransportStatus } from './types';

/** What the engine's command groups share: the store, the platform, and the
 * few primitives that keep state, element and persistence consistent. */
export interface EngineCore {
  deps: EngineDeps;
  state: Store<PlayerState>;
  progress: Store<PlayerProgress>;
  get(): PlayerState;
  /** Merge a change; a no-op when nothing actually differs. */
  patch(change: Partial<PlayerState>): void;
  /** Move the transport (and the stall watchdog with it). */
  transition(status: TransportStatus, change?: Partial<PlayerState>): void;
  /** Replace the queue, persist it, and point the element at its current track. */
  setQueue(queue: QueueState): void;
  setModes(change: Pick<Partial<PlayerState>, 'shuffle' | 'repeat'>): void;
}

/** A patch that skips the emit when every changed key is already equal — so
 * subscribers (and React) only hear about real transitions. */
export function createPatch(state: Store<PlayerState>) {
  return (change: Partial<PlayerState>): void => {
    const s = state.get();
    const keys = Object.keys(change) as (keyof PlayerState)[];
    if (keys.every((k) => Object.is(s[k], change[k]))) return;
    state.set({ ...s, ...change });
  };
}
