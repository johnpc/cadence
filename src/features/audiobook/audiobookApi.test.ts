import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/jellyfinFetch', () => ({ request: vi.fn() }));
import { request } from '../../lib/jellyfinFetch';
import { fetchChapters } from './audiobookApi';

afterEach(() => {
  vi.resetAllMocks();
});

describe('fetchChapters', () => {
  it('calls the plugin chapters endpoint with the encoded item id', async () => {
    vi.mocked(request).mockResolvedValue([{ name: 'One', start: 0 }]);
    const result = await fetchChapters('item 1');
    expect(request).toHaveBeenCalledWith('/Cadence/Audiobooks/item%201/Chapters');
    expect(result).toEqual([{ name: 'One', start: 0 }]);
  });

  it('propagates the empty array for a chapterless file', async () => {
    vi.mocked(request).mockResolvedValue([]);
    expect(await fetchChapters('x')).toEqual([]);
  });
});
