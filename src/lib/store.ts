import { useSyncExternalStore } from 'react';

/**
 * The ONE client-state primitive for everything that is not server state
 * (server state is react-query). A store is a value + subscribers; React reads
 * it with `useStore` (useSyncExternalStore), plain modules read `get()` and
 * `subscribe()`. Every module singleton in the app (session, reachability,
 * cast, play intent, download progress, settings…) is one of these, so there is
 * one mechanism to learn, one way to test, one way to persist.
 */
export interface Store<T> {
  get(): T;
  /** Replace the value (no-op when `Object.is` equal) and notify subscribers. */
  set(next: T): void;
  /** Derive the next value from the current one. */
  update(fn: (current: T) => T): void;
  /** Subscribe to changes; returns an unsubscribe. */
  subscribe(listener: () => void): () => void;
}

export interface StoreOptions<T> {
  /** Persist under this key (localStorage, JSON) and rehydrate on creation. */
  persistKey?: string;
  /** Validate/repair a rehydrated value; return the fallback for junk. */
  parse?: (raw: unknown) => T;
  /** Called on EVERY emit (even without subscribers) — for cross-store effects. */
  onChange?: (next: T) => void;
}

function readPersisted<T>(key: string, fallback: T, parse?: (raw: unknown) => T): T {
  try {
    const raw = typeof localStorage === 'undefined' ? null : localStorage.getItem(key);
    if (raw === null) return fallback;
    const parsed: unknown = JSON.parse(raw);
    return parse ? parse(parsed) : (parsed as T);
  } catch {
    return fallback;
  }
}

function writePersisted<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full / unavailable — persistence is best-effort.
  }
}

/** Create a store. With `persistKey` the initial value is read back from
 * localStorage (falling back to `initial` on absence or junk) and every set
 * is written through. */
export function createStore<T>(initial: T, options: StoreOptions<T> = {}): Store<T> {
  const { persistKey, parse, onChange } = options;
  let value = persistKey ? readPersisted(persistKey, initial, parse) : initial;
  const listeners = new Set<() => void>();
  const set = (next: T): void => {
    if (Object.is(next, value)) return;
    value = next;
    if (persistKey) writePersisted(persistKey, value);
    onChange?.(value);
    for (const l of listeners) l();
  };
  return {
    get: () => value,
    set,
    update: (fn) => set(fn(value)),
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

/** React binding: re-render when the store (or the selected slice) changes. The
 * selector must return a referentially stable value for an unchanged slice
 * (primitives, or a field of the state) — useSyncExternalStore compares with
 * Object.is. */
export function useStore<T>(store: Store<T>): T;
export function useStore<T, S>(store: Store<T>, selector: (state: T) => S): S;
export function useStore<T, S>(store: Store<T>, selector?: (state: T) => S): T | S {
  const read = () => (selector ? selector(store.get()) : store.get());
  return useSyncExternalStore(store.subscribe, read, read);
}
