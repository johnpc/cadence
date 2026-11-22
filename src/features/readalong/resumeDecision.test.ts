import { describe, expect, it } from 'vitest';
import { decideResume } from './resumeDecision';

const parts = [
  { ItemId: 'p1', Duration: 100 },
  { ItemId: 'p2', Duration: 100 },
];

describe('decideResume', () => {
  it('uses the local position when there is no shared one', () => {
    expect(
      decideResume({ local: 40, shared: null, parts, itemId: 'p1', durationSeconds: 100 }),
    ).toEqual({ source: 'jellyfin', seconds: 40 });
    expect(
      decideResume({ local: null, shared: null, parts, itemId: 'p1', durationSeconds: 100 }),
    ).toEqual({ source: 'none' });
  });
  it('ignores a shared position that merely echoes Jellyfin', () => {
    const shared = { Seconds: 150, Timestamp: 1, Source: 'jellyfin' as const };
    expect(decideResume({ local: 40, shared, parts, itemId: 'p1', durationSeconds: 100 })).toEqual({
      source: 'jellyfin',
      seconds: 40,
    });
  });
  it('lets a newer Storyteller position win when it lands in this part', () => {
    const shared = { Seconds: 150, Timestamp: 1, Source: 'storyteller' as const };
    expect(decideResume({ local: 10, shared, parts, itemId: 'p2', durationSeconds: 100 })).toEqual({
      source: 'storyteller',
      seconds: 50,
    });
  });
  it('falls back to local when Storyteller points at another part', () => {
    const shared = { Seconds: 150, Timestamp: 1, Source: 'storyteller' as const };
    expect(decideResume({ local: 10, shared, parts, itemId: 'p1', durationSeconds: 100 })).toEqual({
      source: 'jellyfin',
      seconds: 10,
    });
  });
  it('applies the barely-started and near-the-end guards to Storyteller too', () => {
    const start = { Seconds: 2, Timestamp: 1, Source: 'storyteller' as const };
    expect(
      decideResume({ local: null, shared: start, parts, itemId: 'p1', durationSeconds: 100 }),
    ).toEqual({ source: 'none' });
    const end = { Seconds: 95, Timestamp: 1, Source: 'storyteller' as const };
    expect(
      decideResume({ local: 20, shared: end, parts, itemId: 'p1', durationSeconds: 100 }),
    ).toEqual({ source: 'jellyfin', seconds: 20 });
  });
});
