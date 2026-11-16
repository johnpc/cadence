import { describe, expect, it, vi } from 'vitest';
import type { QueryClient } from '@tanstack/react-query';
import { PLAY_DERIVED_SHELVES, refreshPlayDerivedShelves } from './homeShelfRefresh';

describe('refreshPlayDerivedShelves', () => {
  it('invalidates exactly the recently-played and on-repeat shelves', async () => {
    const invalidateQueries = vi.fn().mockResolvedValue(undefined);
    await refreshPlayDerivedShelves({ invalidateQueries } as unknown as QueryClient);
    expect(invalidateQueries).toHaveBeenCalledTimes(PLAY_DERIVED_SHELVES.length);
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['home', 'recently-played'] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['home', 'on-repeat'] });
  });
});
