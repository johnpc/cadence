import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/jellyfinFetch', () => ({ request: vi.fn() }));
vi.mock('../../lib/sessionStore', () => ({ getSession: () => ({ userId: 'u1', token: 't' }) }));
import { request } from '../../lib/jellyfinFetch';
import { getAudiobooks, getResumableAudiobooks } from './audiobookLibraryApi';

afterEach(() => {
  vi.resetAllMocks();
});

describe('audiobookLibraryApi', () => {
  it('fetches all audiobooks with the AudioBook type', async () => {
    vi.mocked(request).mockResolvedValue({ Items: [{ Id: 'b', Name: 'B', Type: 'AudioBook' }] });
    const result = await getAudiobooks();
    const url = vi.mocked(request).mock.calls[0][0] as string;
    expect(url).toContain('IncludeItemTypes=AudioBook');
    expect(result).toHaveLength(1);
  });

  it('fetches resumable audiobooks with the IsResumable filter', async () => {
    vi.mocked(request).mockResolvedValue({ Items: [] });
    await getResumableAudiobooks();
    const url = vi.mocked(request).mock.calls[0][0] as string;
    expect(url).toContain('Filters=IsResumable');
    expect(url).toContain('IncludeItemTypes=AudioBook');
  });
});
