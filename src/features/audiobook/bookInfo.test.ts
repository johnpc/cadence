import { describe, expect, it } from 'vitest';
import { bookFacts, bookHeaderMeta, formatBookDate } from './bookInfo';
import type { Book } from './groupBooks';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const makeBook = (over: Partial<JellyfinItem>, parts: Partial<JellyfinItem>[] = [over]): Book => ({
  id: 'b',
  title: 'Dune',
  book: { Id: 'b', Name: 'Dune', Type: 'AudioBook', ...over } as JellyfinItem,
  parts: parts.map((p, i) => ({
    Id: `p${i}`,
    Name: `Part ${i}`,
    Type: 'AudioBook',
    ...p,
  })) as JellyfinItem[],
});

describe('formatBookDate', () => {
  it('formats an ISO date as a short human date (UTC-stable)', () => {
    expect(formatBookDate('2026-08-07T12:00:00.000Z')).toBe('Aug 7, 2026');
  });

  it('returns empty for missing or unparseable input', () => {
    expect(formatBookDate(undefined)).toBe('');
    expect(formatBookDate('not-a-date')).toBe('');
  });
});

describe('bookFacts', () => {
  it('includes length (summed across parts), parts, year, and added date', () => {
    const book = makeBook({ ProductionYear: 1965, DateCreated: '2026-08-07T00:00:00Z' }, [
      { RunTimeTicks: 3_600 * 10_000_000 },
      { RunTimeTicks: 3_600 * 10_000_000 },
    ]);
    const facts = bookFacts(book);
    expect(facts).toEqual([
      { label: 'Length', value: '2 hr' },
      { label: 'Parts', value: '2' },
      { label: 'Year', value: '1965' },
      { label: 'Added', value: 'Aug 7, 2026' },
    ]);
  });

  it('omits length when no part reports a duration, and omits missing year/date', () => {
    expect(bookFacts(makeBook({}, [{}, {}]))).toEqual([{ label: 'Parts', value: '2' }]);
  });

  it('says nothing about parts for a single-file book', () => {
    expect(bookFacts(makeBook({}))).toEqual([]);
  });
});

describe('bookHeaderMeta', () => {
  const hour = 3600 * 10_000_000;
  it('joins length, part count and progress into one line', () => {
    const book = makeBook({}, [{ RunTimeTicks: hour }, { RunTimeTicks: hour / 2 }]);
    expect(bookHeaderMeta(book, '40% · 54m left')).toBe('1h 30m · 2 parts · 40% · 54m left');
  });

  it('drops the part count for a single file and the progress before listening', () => {
    expect(bookHeaderMeta(makeBook({ RunTimeTicks: hour }), null)).toBe('1h');
    expect(bookHeaderMeta(makeBook({}), null)).toBe('');
  });
});
