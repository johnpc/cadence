import { afterEach, describe, expect, it } from 'vitest';
import { bookFilterStore } from './bookFilterStore';

afterEach(() => localStorage.clear());

describe('bookFilterStore', () => {
  it('defaults to all and remembers read along', () => {
    expect(bookFilterStore.get()).toBe('all');
    bookFilterStore.set('readalong');
    expect(localStorage.getItem('cadence.books.filter')).toBe('readalong');
    expect(bookFilterStore.get()).toBe('readalong');
  });

  it('reads junk as all', () => {
    localStorage.setItem('cadence.books.filter', 'nope');
    expect(bookFilterStore.get()).toBe('all');
  });
});
