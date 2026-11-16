import { createStoredValue } from '../../lib/store';

/** The "Autoplay" preference (localStorage, per-device): keep playing similar
 * songs (instant-mix radio) when the queue ends, Spotify-style. ON by default —
 * only an explicit 'off' disables it. */
export const autoplayStore = createStoredValue({
  key: 'cadence.autoplay',
  parse: (raw) => raw !== 'off',
  serialize: (on: boolean) => (on ? 'on' : 'off'),
});

export const readAutoplay = (): boolean => autoplayStore.get();
export const writeAutoplay = (on: boolean): void => autoplayStore.set(on);
export const onAutoplayChange = (listener: (on: boolean) => void): (() => void) =>
  autoplayStore.subscribe(() => listener(autoplayStore.get()));
