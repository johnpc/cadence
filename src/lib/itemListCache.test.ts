import { afterEach, describe, expect, it, vi } from 'vitest';
import { createItemListCache } from './itemListCache';
import type { JellyfinItem } from './jellyfinTypes';

const item = (id: string): JellyfinItem => ({ Id: id, Name: id, Type: 'Audio' });

afterEach(() => localStorage.clear());

describe('createItemListCache', () => {
  it('returns undefined for an uncached id', () => {
    const c = createItemListCache('cadence.test-cache');
    expect(c.get('x')).toBeUndefined();
  });

  it('round-trips a list through localStorage under its key', () => {
    const c = createItemListCache('cadence.test-cache');
    c.set('a', [item('1'), item('2')]);
    expect(c.get('a')?.map((i) => i.Id)).toEqual(['1', '2']);
    expect(localStorage.getItem('cadence.test-cache')).toContain('"1"');
  });

  it('fetchAndCache fetches, persists, and returns the list', async () => {
    const c = createItemListCache('cadence.test-cache');
    const fetcher = vi.fn().mockResolvedValue([item('z')]);
    const out = await c.fetchAndCache('a', fetcher);
    expect(fetcher).toHaveBeenCalledWith('a');
    expect(out.map((i) => i.Id)).toEqual(['z']);
    expect(c.get('a')?.map((i) => i.Id)).toEqual(['z']); // persisted
  });

  it('evicts the oldest entries past the cap', () => {
    const c = createItemListCache('cadence.test-cache', 3);
    for (let i = 0; i < 5; i++) c.set(`k${i}`, [item(`${i}`)]);
    expect(c.get('k0')).toBeUndefined(); // evicted
    expect(c.get('k4')).toBeDefined(); // newest kept
  });

  it('separate caches use separate keys (no collision)', () => {
    const a = createItemListCache('cadence.cache-a');
    const b = createItemListCache('cadence.cache-b');
    a.set('x', [item('a')]);
    b.set('x', [item('b')]);
    expect(a.get('x')?.[0].Id).toBe('a');
    expect(b.get('x')?.[0].Id).toBe('b');
  });

  it('tolerates corrupt storage', () => {
    localStorage.setItem('cadence.test-cache', 'not json');
    const c = createItemListCache('cadence.test-cache');
    expect(c.get('a')).toBeUndefined();
  });
});
