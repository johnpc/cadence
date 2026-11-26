// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { badgeFor, EMPTY_INDEX, indexLibrary, statusOf } from './readAlongLibrary';

const lib = indexLibrary({
  Status: 'ok',
  Books: [
    { ItemId: 'a1', Status: 'ready' },
    { ItemId: 'b2', Status: 'aligning' },
    { ItemId: 'c1', Status: 'empty' },
    { ItemId: 'd1', Status: 'ready' },
  ],
});

describe('indexLibrary', () => {
  it('indexes every book by item id and counts the ready ones', () => {
    expect(lib.state).toBe('ok');
    expect(lib.byItem.get('c1')).toBe('empty');
    expect(lib.ready).toBe(2);
  });

  it('an unlinked or unconfigured bridge has nothing ready', () => {
    const u = indexLibrary({ Status: 'unlinked', Books: [] });
    expect(u).toMatchObject({ state: 'unlinked', ready: 0 });
    expect(EMPTY_INDEX.ready).toBe(0);
  });
});

describe('statusOf', () => {
  it('finds a book by its group id', () => {
    expect(statusOf(lib, { id: 'a1', parts: [{ Id: 'a1' }, { Id: 'a2' }] })).toBe('ready');
  });

  it('falls back to any part id when the two sides picked a different first part', () => {
    expect(statusOf(lib, { id: 'b1', parts: [{ Id: 'b1' }, { Id: 'b2' }] })).toBe('aligning');
  });

  it('is undefined for a book the plugin did not list', () => {
    expect(statusOf(lib, { id: 'z', parts: [{ Id: 'z' }] })).toBeUndefined();
    expect(statusOf(EMPTY_INDEX, { id: 'a1', parts: [{ Id: 'a1' }] })).toBeUndefined();
  });
});

describe('badgeFor', () => {
  it('marks ready and aligning books and nothing else', () => {
    expect(badgeFor('ready')).toEqual({ kind: 'ready', label: 'Read along' });
    expect(badgeFor('aligning')).toEqual({ kind: 'aligning', label: 'Aligning…' });
    for (const s of ['unlinked', 'unmatched', 'mismatch', 'empty', undefined] as const)
      expect(badgeFor(s)).toBeNull();
  });
});
