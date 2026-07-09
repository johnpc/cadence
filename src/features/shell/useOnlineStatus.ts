import { useSyncExternalStore } from 'react';

function subscribe(callback: () => void): () => void {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

/** True when the browser reports a network connection. Reacts to online/offline
 * events. `navigator.onLine` is optimistic (true doesn't guarantee reachability)
 * but false is reliable — enough to surface a clear "you're offline" banner. */
export function useOnlineStatus(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true, // assume online during SSR/first paint
  );
}
