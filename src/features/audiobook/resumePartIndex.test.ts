import { describe, expect, it } from 'vitest';
import { resumePartIndex } from './resumePartIndex';
import type { Book } from './groupBooks';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const mk = (played: boolean[]): Book => ({
  id: 'b',
  title: 'Book',
  book: { Id: 'b', Name: 'Book', Type: 'AudioBook' } as JellyfinItem,
  parts: played.map(
    (p, i) =>
      ({
        Id: `p${i}`,
        Name: `Ch ${i}`,
        Type: 'AudioBook',
        UserData: { Played: p },
      }) as JellyfinItem,
  ),
});

describe('resumePartIndex', () => {
  it('returns the first unfinished part', () => {
    expect(resumePartIndex(mk([true, true, false, false]))).toBe(2);
  });

  it('returns 0 when nothing is played yet', () => {
    expect(resumePartIndex(mk([false, false]))).toBe(0);
  });

  it('returns 0 when every part is finished (restart from the top)', () => {
    expect(resumePartIndex(mk([true, true]))).toBe(0);
  });
});
