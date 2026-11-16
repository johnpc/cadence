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

/**
 * A store whose value lives in localStorage under its EXISTING on-disk format
 * (settings like `'on'`/`'off'` predate the JSON stores — changing the format
 * would silently reset every user's preference). Reads go through storage, so a
 * write from anywhere (a test, another module) is always seen; `set` writes and
 * notifies. Storage failures degrade to the parsed default.
 */
export function createStoredValue<T>(options: {
  key: string;
  parse: (raw: string | null) => T;
  serialize: (value: T) => string;
}): Store<T> {
  const { key, parse, serialize } = options;
  const listeners = new Set<() => void>();
  const get = (): T => {
    try {
      return parse(localStorage.getItem(key));
    } catch {
      return parse(null);
    }
  };
  const set = (next: T): void => {
    try {
      localStorage.setItem(key, serialize(next));
    } catch {
      // Storage unavailable — subscribers still hear about it this session.
    }
    for (const l of listeners) l();
  };
  return {
    get,
    set,
    update: (fn) => set(fn(get())),
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

/** Call `onChange(next, prev)` whenever the selected slice of a store changes
 * (compared with `equals`, default Object.is). The plain-module counterpart of
 * `useStore(store, selector)` — how non-React subscribers (MediaSession, the
 * watch bridge, play reporting…) react to state without polling. Returns an
 * unsubscribe. With `immediate`, it also fires once now (prev = undefined). */
export function watch<T, S>(
  store: Store<T>,
  select: (state: T) => S,
  onChange: (next: S, prev: S | undefined) => void,
  options: { immediate?: boolean; equals?: (a: S, b: S) => boolean } = {},
): () => void {
  const equals = options.equals ?? Object.is;
  let last = select(store.get());
  if (options.immediate) onChange(last, undefined);
  return store.subscribe(() => {
    const next = select(store.get());
    if (equals(next, last)) return;
    const prev = last;
    last = next;
    onChange(next, prev);
  });
}
