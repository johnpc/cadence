// @vitest-environment node
import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { __resetDb, persistedCollection } from './persistedCollection';

/** A minimal localStorage for the node environment (the legacy copy lives there). */
function installLocalStorage(): Map<string, string> {
  const data = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  });
  return data;
}

interface Item {
  id: string;
  name: string;
}
const make = () =>
  persistedCollection<Item>({ name: 'downloads', legacyKey: 'legacy.list', keyOf: (i) => i.id });

beforeEach(() => {
  vi.stubGlobal('indexedDB', new IDBFactory());
  __resetDb();
});

describe('persistedCollection (IndexedDB)', () => {
  it('keeps newest first, de-dupes by key, and survives a reload', async () => {
    installLocalStorage();
    const a = make();
    await a.hydrate();
    a.put({ id: '1', name: 'one' });
    a.put({ id: '2', name: 'two' });
    a.put({ id: '1', name: 'one again' });
    a.put({ id: '3', name: 'three' });
    a.remove('3');
    expect(a.read().map((i) => i.id)).toEqual(['1', '2']);
    await a.flushed();
    const b = make(); // a fresh launch
    await b.hydrate();
    expect(b.read()).toEqual([
      { id: '1', name: 'one again' },
      { id: '2', name: 'two' },
    ]);
  });

  it('migrates the old localStorage list once, keeping its order, then drops it', async () => {
    const ls = installLocalStorage();
    ls.set(
      'legacy.list',
      JSON.stringify([
        { id: 'new', name: 'n' },
        { id: 'old', name: 'o' },
      ]),
    );
    const a = make();
    await a.hydrate();
    expect(a.read().map((i) => i.id)).toEqual(['new', 'old']);
    expect(ls.has('legacy.list')).toBe(false);
    await a.flushed();
    const b = make();
    await b.hydrate();
    expect(b.read().map((i) => i.id)).toEqual(['new', 'old']);
  });

  it('falls back to localStorage when IndexedDB will not open', async () => {
    const ls = installLocalStorage();
    vi.stubGlobal('indexedDB', {
      open: () => {
        const req: { onerror?: () => void; error: Error } = { error: new Error('blocked') };
        setTimeout(() => req.onerror?.(), 0);
        return req;
      },
    });
    const a = make();
    await a.hydrate();
    a.put({ id: '1', name: 'one' });
    expect(JSON.parse(ls.get('legacy.list') ?? '[]')).toEqual([{ id: '1', name: 'one' }]);
    a.remove('1');
    expect(a.read()).toEqual([]);
  });
});

describe('persistedCollection (no IndexedDB)', () => {
  it('reads through the original localStorage format and tolerates junk', async () => {
    vi.stubGlobal('indexedDB', undefined);
    const ls = installLocalStorage();
    const a = make();
    await a.hydrate();
    ls.set('legacy.list', 'not json');
    expect(a.read()).toEqual([]);
    a.put({ id: '1', name: 'one' });
    expect(a.read()).toEqual([{ id: '1', name: 'one' }]);
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('full');
      },
    });
    expect(a.read()).toEqual([]);
    expect(() => a.put({ id: '2', name: 'two' })).not.toThrow();
  });
});
