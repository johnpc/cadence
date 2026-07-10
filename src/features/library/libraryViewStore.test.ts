import { afterEach, describe, expect, it } from 'vitest';
import { readLibraryView, writeLibraryView, onLibraryViewChange } from './libraryViewStore';

describe('libraryViewStore', () => {
  afterEach(() => localStorage.clear());

  it('defaults to list', () => {
    expect(readLibraryView()).toBe('list');
  });

  it('round-trips grid/list', () => {
    writeLibraryView('grid');
    expect(readLibraryView()).toBe('grid');
    writeLibraryView('list');
    expect(readLibraryView()).toBe('list');
  });

  it('treats any non-"grid" value as list', () => {
    localStorage.setItem('cadence.library.view', 'nonsense');
    expect(readLibraryView()).toBe('list');
  });

  it('notifies subscribers on change and stops after unsubscribe', () => {
    const seen: string[] = [];
    const off = onLibraryViewChange((v) => seen.push(v));
    writeLibraryView('grid');
    off();
    writeLibraryView('list');
    expect(seen).toEqual(['grid']);
  });
});
