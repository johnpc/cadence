import { useEffect, useState } from 'react';
import { readForceOffline, writeForceOffline, onForceOfflineChange } from './forceOfflineStore';

/** The "Offline mode" preference as reactive state + a setter. Subscribes to the
 * store so the Settings toggle, the offline library, and the fetch layer stay in
 * sync. */
export function useForceOffline(): {
  forceOffline: boolean;
  setForceOffline: (on: boolean) => void;
} {
  const [forceOffline, setState] = useState(readForceOffline);
  useEffect(() => onForceOfflineChange(setState), []);
  return { forceOffline, setForceOffline: writeForceOffline };
}
