import { createStoredValue } from '../../lib/store';

/** The Books tab's filter: every book, or only those ready to read along.
 * Per-device (localStorage); anything unrecognised reads as 'all'. */
export type BookFilter = 'all' | 'readalong';

export const bookFilterStore = createStoredValue<BookFilter>({
  key: 'cadence.books.filter',
  parse: (raw) => (raw === 'readalong' ? 'readalong' : 'all'),
  serialize: (filter) => filter,
});
