// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { bookParts, bookPosition, partAt, partDurations } from './bookPosition';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const T = 10_000_000;
function part(id: string, index: number, seconds: number, name = 'Harbor Winds'): JellyfinItem {
  return {
    Id: id,
    Name: name,
    Type: 'AudioBook',
    Album: 'Harbor Winds',
    AlbumArtist: 'Mara Quill',
    IndexNumber: index,
    RunTimeTicks: seconds * T,
  } as JellyfinItem;
}
const p1 = part('p1', 1, 200);
const p2 = part('p2', 2, 300);
const p3 = part('p3', 3, 400);
const song = { Id: 's1', Name: 'Undertow', Type: 'Audio', Album: 'Harbor Winds' } as JellyfinItem;

describe('bookParts', () => {
  it('collects the queued parts of the same book in play order, deduped, ignoring music', () => {
    expect(bookParts(p2, [p3, song, p1, p2]).map((p) => p.Id)).toEqual(['p1', 'p2', 'p3']);
  });

  it('is just the current item when nothing else is queued', () => {
    expect(bookParts(p1, []).map((p) => p.Id)).toEqual(['p1']);
  });
});

describe('partDurations / partAt', () => {
  it('prefers the live duration for the playing part', () => {
    expect(partDurations([p1, p2], 'p2', 301.5)).toEqual([200, 301.5]);
    expect(partDurations([p1, p2], 'p2', 0)).toEqual([200, 300]);
  });

  it('resolves a global position to its part, at and across boundaries, clamped', () => {
    const d = [200, 300, 400];
    const parts = [p1, p2, p3];
    expect(partAt(parts, d, 0)).toEqual({ itemId: 'p1', seconds: 0 });
    expect(partAt(parts, d, 199)).toEqual({ itemId: 'p1', seconds: 199 });
    expect(partAt(parts, d, 200)).toEqual({ itemId: 'p2', seconds: 0 });
    expect(partAt(parts, d, 650)).toEqual({ itemId: 'p3', seconds: 150 });
    expect(partAt(parts, d, 5000)).toEqual({ itemId: 'p3', seconds: 400 });
    expect(partAt([], [], 10)).toBeNull();
  });
});

describe('bookPosition', () => {
  it('single file with chapter markers: book span + the marker chapter', () => {
    const single = part('b', 1, 3700, 'Hogfather');
    single.Album = 'Hogfather';
    const r = bookPosition({
      current: single,
      parts: [single],
      position: 500,
      duration: 3700,
      chapters: [
        { name: 'Dedication', start: 0 },
        { name: '1', start: 168 },
        { name: '2', start: 900 },
      ],
      rate: 1,
    });
    expect(r.book).toEqual({
      title: 'Hogfather',
      position: 500,
      duration: 3700,
      remainingAtRate: 3200,
    });
    expect(r.chapter).toEqual({
      title: '1',
      position: 332,
      duration: 732,
      remainingAtRate: 400,
      start: 168,
      index: 1,
      count: 3,
    });
  });

  it('last marker chapter ends at the file end', () => {
    const single = part('b', 1, 1000, 'X');
    const r = bookPosition({
      current: single,
      parts: [single],
      position: 950,
      duration: 1000,
      chapters: [
        { name: 'A', start: 0 },
        { name: 'B', start: 900 },
      ],
      rate: 1,
    });
    expect(r.chapter).toMatchObject({ title: 'B', position: 50, duration: 100, index: 1 });
  });

  it('multi-part book without markers: parts are the chapters, titled "Part n of N" when named like the book', () => {
    const r = bookPosition({
      current: p2,
      parts: [p1, p2, p3],
      position: 50,
      duration: 300,
      chapters: [],
      rate: 1,
    });
    expect(r.book).toMatchObject({ title: 'Harbor Winds', position: 250, duration: 900 });
    expect(r.chapter).toMatchObject({
      title: 'Part 2 of 3',
      position: 50,
      duration: 300,
      start: 200,
      index: 1,
      count: 3,
    });
  });

  it('a part with its own name keeps it', () => {
    const named = part('n2', 2, 300, 'The Storm');
    const r = bookPosition({
      current: named,
      parts: [p1, named],
      position: 0,
      duration: 300,
      chapters: [],
      rate: 1,
    });
    expect(r.chapter?.title).toBe('The Storm');
  });

  it('single file without markers: only the book span', () => {
    const r = bookPosition({
      current: p1,
      parts: [p1],
      position: 20,
      duration: 200,
      chapters: [],
      rate: 1,
    });
    expect(r.chapter).toBeNull();
    expect(r.book.position).toBe(20);
  });

  it('remaining time is wall-clock at the playback speed', () => {
    const r = bookPosition({
      current: p1,
      parts: [p1, p2],
      position: 0,
      duration: 200,
      chapters: [],
      rate: 2,
    });
    expect(r.book.remainingAtRate).toBe(250);
    expect(r.chapter?.remainingAtRate).toBe(100);
    const odd = bookPosition({
      current: p1,
      parts: [p1],
      position: 0,
      duration: 200,
      chapters: [],
      rate: 0,
    });
    expect(odd.book.remainingAtRate).toBe(200);
  });

  it('falls back to the current item when given no parts', () => {
    const r = bookPosition({
      current: p1,
      parts: [],
      position: 10,
      duration: 200,
      chapters: [],
      rate: 1,
    });
    expect(r.book).toMatchObject({ title: 'Harbor Winds', position: 10, duration: 200 });
  });
});
