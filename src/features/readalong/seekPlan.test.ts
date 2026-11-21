import { describe, expect, it } from 'vitest';
import { planSeek } from './seekPlan';
import type { ReadAlongBook } from './storytellerApi';

const book: ReadAlongBook = {
  Status: 'ready',
  BookUuid: 'u',
  Title: 'T',
  Duration: 150,
  Parts: [
    { ItemId: 'p1', Duration: 100 },
    { ItemId: 'p2', Duration: 50 },
  ],
  Chapters: [{ Href: 'c1.xhtml', Title: 'One' }],
  Clips: [
    { Start: 10, End: 14, Chapter: 0, Fragment: 's1' },
    { Start: 120, End: 124, Chapter: 0, Fragment: 's2' },
  ],
};

describe('planSeek', () => {
  it('seeks within the current part', () => {
    expect(
      planSeek({ book, chapter: 0, fragment: 's1', currentItemId: 'p1', queueIds: ['p1', 'p2'] }),
    ).toEqual({ kind: 'seek', seconds: 10 });
  });
  it('jumps the queue to another part, with the offset inside it', () => {
    expect(
      planSeek({ book, chapter: 0, fragment: 's2', currentItemId: 'p1', queueIds: ['p1', 'p2'] }),
    ).toEqual({ kind: 'jump', queueIndex: 1, itemId: 'p2', seconds: 20 });
  });
  it('does nothing for an unknown sentence or an unqueued part', () => {
    expect(
      planSeek({ book, chapter: 0, fragment: 'zz', currentItemId: 'p1', queueIds: ['p1'] }),
    ).toEqual({ kind: 'none' });
    expect(
      planSeek({ book, chapter: 0, fragment: 's2', currentItemId: 'p1', queueIds: ['p1'] }),
    ).toEqual({ kind: 'none' });
  });
});
