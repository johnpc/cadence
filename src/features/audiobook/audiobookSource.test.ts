import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/jellyfinFetch', () => ({ request: vi.fn() }));
vi.mock('../../lib/runtimeConfig', () => ({ audiobooksSourceEnabled: vi.fn() }));
vi.mock('../../lib/sessionStore', () => ({ getSession: vi.fn() }));

import { request } from '../../lib/jellyfinFetch';
import { audiobooksSourceEnabled } from '../../lib/runtimeConfig';
import { getSession } from '../../lib/sessionStore';
import { fetchAudiobookLibrary, audiobookSourceEnabled } from './audiobookSource';

beforeEach(() => {
  vi.mocked(getSession).mockReturnValue({ token: 't', userId: 'u1' });
});
afterEach(() => {
  vi.resetAllMocks();
});

describe('audiobookSource', () => {
  it('audiobookSourceEnabled mirrors the plugin config flag', () => {
    vi.mocked(audiobooksSourceEnabled).mockReturnValue(true);
    expect(audiobookSourceEnabled()).toBe(true);
    vi.mocked(audiobooksSourceEnabled).mockReturnValue(false);
    expect(audiobookSourceEnabled()).toBe(false);
  });

  it('fetches the library scoped to the signed-in user and returns Books', async () => {
    vi.mocked(request).mockResolvedValue({
      Books: [{ Id: 'a', Name: 'Dune', Type: 'AudioBook' }],
    });
    const books = await fetchAudiobookLibrary();
    expect(request).toHaveBeenCalledWith('/Cadence/Audiobooks?userId=u1');
    expect(books[0].Id).toBe('a');
  });

  it('coerces a missing/non-array Books field to an empty list', async () => {
    vi.mocked(request).mockResolvedValue({});
    expect(await fetchAudiobookLibrary()).toEqual([]);
    vi.mocked(request).mockResolvedValue({ Books: 'oops' });
    expect(await fetchAudiobookLibrary()).toEqual([]);
  });

  it('sends an empty userId when there is no session (defensive)', async () => {
    vi.mocked(getSession).mockReturnValue(null);
    vi.mocked(request).mockResolvedValue({ Books: [] });
    await fetchAudiobookLibrary();
    expect(request).toHaveBeenCalledWith('/Cadence/Audiobooks?userId=');
  });

  it('propagates a request error (so react-query falls back to the native scan)', async () => {
    vi.mocked(request).mockRejectedValue(new Error('503'));
    await expect(fetchAudiobookLibrary()).rejects.toThrow('503');
  });
});
