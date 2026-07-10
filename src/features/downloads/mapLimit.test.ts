import { describe, expect, it, vi } from 'vitest';
import { mapLimit } from './mapLimit';

describe('mapLimit', () => {
  it('runs every item through the task', async () => {
    const seen: number[] = [];
    await mapLimit([1, 2, 3, 4], 2, async (n) => {
      seen.push(n);
    });
    expect(seen.sort()).toEqual([1, 2, 3, 4]);
  });

  it('caps concurrency at `limit`', async () => {
    let inFlight = 0;
    let peak = 0;
    await mapLimit([1, 2, 3, 4, 5, 6], 2, async () => {
      inFlight++;
      peak = Math.max(peak, inFlight);
      await Promise.resolve();
      inFlight--;
    });
    expect(peak).toBeLessThanOrEqual(2);
  });

  it('reports success/failure per item without aborting the batch', async () => {
    const onEach = vi.fn();
    await mapLimit(
      [1, 2, 3],
      3,
      async (n) => {
        if (n === 2) throw new Error('boom');
      },
      onEach,
    );
    expect(onEach).toHaveBeenCalledTimes(3);
    expect(onEach.mock.calls.filter(([ok]) => ok).length).toBe(2);
    expect(onEach.mock.calls.filter(([ok]) => !ok).length).toBe(1);
  });

  it('handles an empty list (no work, resolves)', async () => {
    const task = vi.fn();
    await mapLimit([], 4, task);
    expect(task).not.toHaveBeenCalled();
  });
});
