import { useStore } from '../../lib/store';
import { forceOfflineStore, writeForceOffline } from './forceOfflineStore';

/** The "Offline mode" preference as reactive state + a setter, shared by the
 * Settings toggle, the offline library, and the fetch layer. */
export function useForceOffline(): {
  forceOffline: boolean;
  setForceOffline: (on: boolean) => void;
} {
  return { forceOffline: useStore(forceOfflineStore), setForceOffline: writeForceOffline };
}
