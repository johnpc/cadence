import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/jellyfinFetch', () => ({ request: vi.fn() }));
vi.mock('../../lib/sessionStore', () => ({
  getSession: vi.fn(() => ({ token: 't', userId: 'u1' })),
}));
vi.mock('../../lib/queryClient', () => ({
  queryClient: { invalidateQueries: vi.fn() },
}));

import { request } from '../../lib/jellyfinFetch';
import { getSession } from '../../lib/sessionStore';
import { queryClient } from '../../lib/queryClient';
import { refreshHomeShelves } from './refreshHome';

afterEach(() => {
  vi.resetAllMocks();
  vi.useRealTimers();
});

describe('refreshHomeShelves', () => {
  it('POSTs the per-user refresh, then invalidates the client plugin-shelves query', async () => {
    vi.mocked(request).mockResolvedValue(undefined);
    vi.useFakeTimers();
    const done = refreshHomeShelves();
    await vi.runAllTimersAsync();
    await done;
    expect(request).toHaveBeenCalledWith('/Cadence/Home/Refresh?userId=u1', { method: 'POST' });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['home', 'plugin-shelves'],
    });
  });

  it('sends an empty userId when there is no session (defensive)', async () => {
    vi.mocked(getSession).mockReturnValue(null);
    vi.mocked(request).mockResolvedValue(undefined);
    vi.useFakeTimers();
    const done = refreshHomeShelves();
    await vi.runAllTimersAsync();
    await done;
    expect(request).toHaveBeenCalledWith('/Cadence/Home/Refresh?userId=', { method: 'POST' });
  });
});
