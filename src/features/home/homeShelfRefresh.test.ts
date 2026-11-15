import { describe, expect, it, vi } from 'vitest';
import type { QueryClient } from '@tanstack/react-query';
vi.mock('./homeSource', () => ({
  requestHomeShelvesRebuild: vi.fn().mockResolvedValue(undefined),
}));
import { requestHomeShelvesRebuild } from './homeSource';
import { PLAY_DERIVED_SHELVES, refreshPlayDerivedShelves } from './homeShelfRefresh';

describe('refreshPlayDerivedShelves', () => {
  it('invalidates exactly the recently-played and on-repeat shelves', async () => {
    const invalidateQueries = vi.fn().mockResolvedValue(undefined);
    await refreshPlayDerivedShelves({ invalidateQueries } as unknown as QueryClient);
    expect(invalidateQueries).toHaveBeenCalledTimes(PLAY_DERIVED_SHELVES.length);
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['home', 'recently-played'] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['home', 'on-repeat'] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['home', 'plugin-shelves'] });
    // The plugin's server-side cache is asked to rebuild BEFORE the client refetches.
    expect(requestHomeShelvesRebuild).toHaveBeenCalledTimes(1);
    expect(vi.mocked(requestHomeShelvesRebuild).mock.invocationCallOrder[0]).toBeLessThan(
      invalidateQueries.mock.invocationCallOrder[0],
    );
  });
});
