// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { applyBookFilter, effectiveBookFilter } from './readAlongFilter';
import { EMPTY_INDEX, indexLibrary } from '../readalong/readAlongLibrary';
import type { Book } from './groupBooks';

const book = (id: string) => ({ id, parts: [{ Id: id }], title: id }) as unknown as Book;
const index = indexLibrary({
  Status: 'ok',
  Books: [
    { ItemId: 'a', Status: 'ready' },
    { ItemId: 'b', Status: 'aligning' },
  ],
});

describe('effectiveBookFilter', () => {
  it('keeps the stored choice while some book is ready', () => {
    expect(effectiveBookFilter('readalong', index)).toBe('readalong');
  });

  it('falls back to all when nothing can be read along', () => {
    expect(effectiveBookFilter('readalong', EMPTY_INDEX)).toBe('all');
  });
});

describe('applyBookFilter', () => {
  const books = [book('a'), book('b'), book('c')];
  it('all keeps every book', () => {
    expect(applyBookFilter(books, 'all', index)).toBe(books);
  });

  it('readalong keeps only the ready ones', () => {
    expect(applyBookFilter(books, 'readalong', index).map((b) => b.id)).toEqual(['a']);
  });
});
