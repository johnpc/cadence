import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/jellyfinFetch', () => ({ request: vi.fn() }));
vi.mock('../../lib/sessionStore', () => ({ getSession: vi.fn() }));
import { request } from '../../lib/jellyfinFetch';
import { getSession } from '../../lib/sessionStore';
import { fetchChapters } from './audiobookApi';

afterEach(() => {
  vi.resetAllMocks();
});

describe('fetchChapters', () => {
  it('calls the native item endpoint with the encoded id and converts ticks to seconds', async () => {
    vi.mocked(getSession).mockReturnValue({ token: 't', userId: 'u1' });
    vi.mocked(request).mockResolvedValue({
      Chapters: [
        { Name: 'One', StartPositionTicks: 0 },
        { Name: 'Two', StartPositionTicks: 9_000_000_000 },
      ],
    });
    const result = await fetchChapters('item 1');
    expect(request).toHaveBeenCalledWith('/Items/item%201?fields=Chapters&userId=u1');
    expect(result).toEqual([
      { name: 'One', start: 0 },
      { name: 'Two', start: 900 },
    ]);
  });

  it('returns the empty array for a chapterless file (missing Chapters field)', async () => {
    vi.mocked(getSession).mockReturnValue({ token: 't', userId: 'u1' });
    vi.mocked(request).mockResolvedValue({});
    expect(await fetchChapters('x')).toEqual([]);
  });

  it('defaults a nameless or tickless chapter instead of producing undefined', async () => {
    vi.mocked(getSession).mockReturnValue(null);
    vi.mocked(request).mockResolvedValue({ Chapters: [{}] });
    expect(await fetchChapters('x')).toEqual([{ name: '', start: 0 }]);
    // No session (e.g. mid-sign-out) still issues a well-formed request.
    expect(request).toHaveBeenCalledWith('/Items/x?fields=Chapters&userId=');
  });
});
