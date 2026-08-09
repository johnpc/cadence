import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('../../lib/jellyfinItems', () => ({ getItem: vi.fn() }));
import { getItem } from '../../lib/jellyfinItems';
import { liveResumeSeconds } from './liveResumeSeconds';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const S = 10_000_000;
const mockGetItem = vi.mocked(getItem);
const book = (over: Partial<JellyfinItem> = {}): JellyfinItem =>
  ({ Id: 'b', Name: 'Book', Type: 'AudioBook', ...over }) as JellyfinItem;

describe('liveResumeSeconds', () => {
  beforeEach(() => {
    mockGetItem.mockReset();
  });

  it('returns null for music without hitting the server', async () => {
    const song = { Id: 's', Name: 'S', Type: 'Audio' } as JellyfinItem;
    expect(await liveResumeSeconds(song, 36000)).toBeNull();
    expect(mockGetItem).not.toHaveBeenCalled();
  });

  it('uses the FRESH server position over the stale passed-in item', async () => {
    // The player holds a snapshot at 0; the server knows we're 1h in.
    mockGetItem.mockResolvedValue(book({ UserData: { PlaybackPositionTicks: 3600 * S } }));
    const stale = book({ UserData: { PlaybackPositionTicks: 0 } });
    expect(await liveResumeSeconds(stale, 36000)).toBe(3600);
  });

  it('applies the resumeSeconds guards to the fresh data (played → null)', async () => {
    mockGetItem.mockResolvedValue(
      book({ UserData: { PlaybackPositionTicks: 3600 * S, Played: true } }),
    );
    expect(await liveResumeSeconds(book(), 36000)).toBeNull();
  });

  it('falls back to the passed-in item when the live read fails', async () => {
    mockGetItem.mockRejectedValueOnce(new Error('offline'));
    const withSnapshot = book({ UserData: { PlaybackPositionTicks: 1800 * S } });
    expect(await liveResumeSeconds(withSnapshot, 36000)).toBe(1800);
  });
});
