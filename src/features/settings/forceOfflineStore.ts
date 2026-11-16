import { createStoredValue } from '../../lib/store';

/**
 * The "Offline mode" preference (localStorage, per-device). When ON, Cadence
 * behaves as if there is no server even if one is reachable — it stops all
 * network calls and shows only your downloaded content (the iPod-style offline
 * library). OFF by default; combined with real reachability by the shell.
 */
export const forceOfflineStore = createStoredValue({
  key: 'cadence.forceOffline',
  parse: (raw) => raw === 'on',
  serialize: (on: boolean) => (on ? 'on' : 'off'),
});

export const readForceOffline = (): boolean => forceOfflineStore.get();
export const writeForceOffline = (on: boolean): void => forceOfflineStore.set(on);
export const onForceOfflineChange = (listener: (on: boolean) => void): (() => void) =>
  forceOfflineStore.subscribe(() => listener(forceOfflineStore.get()));
