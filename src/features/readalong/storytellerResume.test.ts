// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../audiobook/liveResumeSeconds', () => ({ liveResumeSeconds: vi.fn() }));
vi.mock('../../lib/runtimeConfig', () => ({ storytellerEnabled: vi.fn() }));
vi.mock('./storytellerApi', () => ({ getSharedPosition: vi.fn(), getReadAlongBook: vi.fn() }));
import { liveResumeSeconds } from '../audiobook/liveResumeSeconds';
import { storytellerEnabled } from '../../lib/runtimeConfig';
import { getReadAlongBook, getSharedPosition } from './storytellerApi';
import { storytellerResumeSeconds } from './storytellerResume';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const book = { Id: 'p2', Name: 'Book', Type: 'AudioBook' } as JellyfinItem;
const parts = [
  { ItemId: 'p1', Duration: 100 },
  { ItemId: 'p2', Duration: 100 },
];

describe('storytellerResumeSeconds', () => {
  beforeEach(() => {
    vi.mocked(liveResumeSeconds).mockReset().mockResolvedValue(30);
    vi.mocked(storytellerEnabled).mockReset().mockReturnValue(true);
    vi.mocked(getSharedPosition).mockReset();
    vi.mocked(getReadAlongBook).mockReset();
  });

  it('is exactly the live Jellyfin read when the feature is off', async () => {
    vi.mocked(storytellerEnabled).mockReturnValue(false);
    expect(await storytellerResumeSeconds(book, 100)).toBe(30);
    expect(getSharedPosition).not.toHaveBeenCalled();
  });

  it('never consults the bridge for music', async () => {
    vi.mocked(liveResumeSeconds).mockResolvedValue(null);
    const song = { Id: 's', Name: 'S', Type: 'Audio' } as JellyfinItem;
    expect(await storytellerResumeSeconds(song, 100)).toBeNull();
    expect(getSharedPosition).not.toHaveBeenCalled();
  });

  it('lets a newer Storyteller position in this part win', async () => {
    vi.mocked(getSharedPosition).mockResolvedValue({
      Seconds: 160,
      Timestamp: 2,
      Source: 'storyteller',
    });
    vi.mocked(getReadAlongBook).mockResolvedValue({
      Status: 'ready',
      BookUuid: 'u',
      Title: 'T',
      Duration: 200,
      Parts: parts,
      Chapters: [],
      Clips: [],
    });
    expect(await storytellerResumeSeconds(book, 100)).toBe(60);
  });

  it('degrades to the local position when the bridge fails', async () => {
    vi.mocked(getSharedPosition).mockRejectedValue(new Error('502'));
    vi.mocked(getReadAlongBook).mockRejectedValue(new Error('502'));
    expect(await storytellerResumeSeconds(book, 100)).toBe(30);
  });

  it('returns null when neither side has a position', async () => {
    vi.mocked(liveResumeSeconds).mockResolvedValue(null);
    vi.mocked(getSharedPosition).mockResolvedValue(null);
    vi.mocked(getReadAlongBook).mockResolvedValue(null as never);
    expect(await storytellerResumeSeconds(book, 100)).toBeNull();
  });
});
