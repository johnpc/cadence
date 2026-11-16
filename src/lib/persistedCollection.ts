/**
 * A durable, keyed list for on-device data that can grow large — the offline
 * downloads index and the offline playlists. Lives in IndexedDB (asynchronous,
 * not capped at localStorage's ~5 MB shared with every other cache), mirrored in
 * memory so the many synchronous readers ("is this track downloaded?") stay
 * synchronous.
 *
 * - `hydrate()` loads it once at boot (main.tsx waits for it before first
 *   render), migrating the old localStorage copy the first time.
 * - Writes update memory immediately and are queued to IndexedDB in order.
 * - Where IndexedDB doesn't exist (jsdom unit tests, very old webviews) or won't
 *   open, it falls back to the original localStorage format, read-through.
 *
 * Newest first: `put` moves an item to the front, like the old index.
 */
const DB_NAME = 'cadence';
const DB_VERSION = 1;
const STORES = ['downloads', 'offline-playlists'] as const;
export type CollectionName = (typeof STORES)[number];

interface StoredRecord<T> {
  key: string;
  savedAt: number;
  value: T;
}

export interface PersistedCollection<T> {
  read(): readonly T[];
  put(item: T): void;
  remove(key: string): void;
  hydrate(): Promise<void>;
  /** Resolves once every queued IndexedDB write has landed (tests, teardown). */
  flushed(): Promise<void>;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  dbPromise ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      for (const name of STORES) {
        if (!req.result.objectStoreNames.contains(name))
          req.result.createObjectStore(name, { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function request<R>(req: IDBRequest<R>): Promise<R> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Test-only: forget the open connection (fake-indexeddb is reset between suites). */
export function __resetDb(): void {
  dbPromise = null;
}

function readLegacy<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function writeLegacy<T>(key: string, items: readonly T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch {
    // Storage full / unavailable — best-effort, like before.
  }
}

export function persistedCollection<T>(options: {
  name: CollectionName;
  /** The localStorage key the list used to live under (migrated, then dropped). */
  legacyKey: string;
  keyOf: (item: T) => string;
}): PersistedCollection<T> {
  const { name, legacyKey, keyOf } = options;
  let mode: 'legacy' | 'idb' = typeof indexedDB === 'undefined' ? 'legacy' : 'idb';
  let items: readonly T[] = [];
  let clock = 0;
  let queue: Promise<void> = Promise.resolve();
  const tick = () => (clock = Math.max(clock + 1, Date.now()));

  const write = (fn: (store: IDBObjectStore) => void) => {
    queue = queue
      .then(() => openDb())
      .then(
        (db) =>
          new Promise<void>((resolve, reject) => {
            const tx = db.transaction(name, 'readwrite');
            fn(tx.objectStore(name));
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
          }),
      )
      .catch(() => undefined);
  };

  const migrate = (legacy: T[]) => {
    const base = Date.now();
    clock = base + legacy.length;
    write((store) =>
      legacy.forEach((value, i) =>
        store.put({ key: keyOf(value), savedAt: base + legacy.length - i, value }),
      ),
    );
    localStorage.removeItem(legacyKey);
    return legacy;
  };

  return {
    read: () => (mode === 'legacy' ? readLegacy<T>(legacyKey) : items),
    put(item) {
      const key = keyOf(item);
      const next = [item, ...this.read().filter((i) => keyOf(i) !== key)];
      if (mode === 'legacy') return writeLegacy(legacyKey, next);
      items = next;
      write((store) => store.put({ key, savedAt: tick(), value: item }));
    },
    remove(key) {
      const next = this.read().filter((i) => keyOf(i) !== key);
      if (mode === 'legacy') return writeLegacy(legacyKey, next);
      items = next;
      write((store) => store.delete(key));
    },
    async hydrate() {
      if (mode === 'legacy') return;
      try {
        const db = await openDb();
        const records = await request<StoredRecord<T>[]>(
          db.transaction(name, 'readonly').objectStore(name).getAll(),
        );
        const legacy = readLegacy<T>(legacyKey);
        if (!records.length && legacy.length) {
          items = migrate(legacy);
          return;
        }
        records.sort((a, b) => b.savedAt - a.savedAt);
        clock = records[0]?.savedAt ?? 0;
        items = records.map((r) => r.value);
      } catch {
        // IndexedDB refused to open (private mode, quota, a broken profile):
        // keep working on the original localStorage list.
        mode = 'legacy';
      }
    },
    flushed: () => queue,
  };
}
