import { afterEach, describe, expect, it, vi } from 'vitest';
import { playChapter } from './playChapter';
import { takePendingSeek } from '../player/pendingSeek';
import type { Book } from './groupBooks';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const part = { Id: 'p1', Name: 'Book', Type: 'AudioBook' } as JellyfinItem;
const book: Book = { id: 'p1', title: 'Book', book: part, parts: [part] };

afterEach(() => {
  takePendingSeek('p1');
});

describe('playChapter', () => {
  it('seeks directly when the book file is already the current track', () => {
    const seek = vi.fn();
    const playQueue = vi.fn();
    playChapter({ current: part, seek, playQueue }, book, 120);
    expect(seek).toHaveBeenCalledWith(120);
    expect(playQueue).not.toHaveBeenCalled();
    // no pending seek left behind
    expect(takePendingSeek('p1')).toBeNull();
  });

  it('starts the book and registers a pending seek when it is not playing', () => {
    const seek = vi.fn();
    const playQueue = vi.fn();
    playChapter({ current: null, seek, playQueue }, book, 300);
    expect(playQueue).toHaveBeenCalledWith(book.parts, 0);
    expect(seek).not.toHaveBeenCalled();
    expect(takePendingSeek('p1')).toBe(300);
  });
});
