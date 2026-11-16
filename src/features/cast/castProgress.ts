import { createStore } from '../../lib/store';

/**
 * The receiver's playback position while casting, in its own store (it ticks
 * often — the same reason the player keeps progress apart from its state). Fed
 * from the Cast plugin's MEDIA_UPDATE events; read so the scrubber reflects the
 * TV, not the silent local element.
 */
export interface CastProgress {
  position: number;
  duration: number;
}

export const castProgressStore = createStore<CastProgress>({ position: 0, duration: 0 });

export const getCastProgress = (): CastProgress => castProgressStore.get();
export const setCastProgress = (next: CastProgress): void => castProgressStore.set(next);
export const onCastProgressChange = (listener: () => void): (() => void) =>
  castProgressStore.subscribe(listener);
