import { describe, expect, it, vi } from 'vitest';
import { playBook } from './playBook';
import { getPlayContext } from '../player/playContext';
import type { Book } from './groupBooks';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const book: Book = {
  id: 'b',
  title: 'Dune',
  book: { Id: 'b', Name: 'Dune', Type: 'AudioBook' } as JellyfinItem,
  parts: [
    { Id: 'p0', Name: 'Ch 1', Type: 'AudioBook' } as JellyfinItem,
    { Id: 'p1', Name: 'Ch 2', Type: 'AudioBook' } as JellyfinItem,
  ],
};

describe('playBook', () => {
  it('plays the parts as a queue from the start and sets the audiobook context', () => {
    const playQueue = vi.fn();
    playBook({ playQueue }, book);
    expect(playQueue).toHaveBeenCalledWith(book.parts, 0);
    const ctx = getPlayContext();
    expect(ctx).toMatchObject({ kind: 'audiobook', label: 'Dune', path: '/audiobooks' });
    expect(ctx?.trackIds.size).toBe(2);
  });

  it('starts at a given part index (resume)', () => {
    const playQueue = vi.fn();
    playBook({ playQueue }, book, 1);
    expect(playQueue).toHaveBeenCalledWith(book.parts, 1);
  });
});
