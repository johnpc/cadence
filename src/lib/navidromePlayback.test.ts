import { describe, expect, it, vi } from 'vitest';

vi.mock('./navidromeFetch', () => ({ request: vi.fn() }));

import { request } from './navidromeFetch';
import {
  reportPlaybackStart,
  reportPlaybackProgress,
  reportPlaybackStopped,
} from './navidromePlayback';

const mockedRequest = vi.mocked(request);

describe('navidromePlayback', () => {
  it('reportPlaybackStart scrobbles at position 0 with submission=false', async () => {
    mockedRequest.mockResolvedValue({});
    await reportPlaybackStart('song1');
    expect(request).toHaveBeenCalledWith('/scrobble', {
      params: { id: 'song1', submission: false, position: 0 },
    });
  });

  it('reportPlaybackProgress converts seconds to ms, submission=false', async () => {
    mockedRequest.mockResolvedValue({});
    await reportPlaybackProgress('song1', 12.5);
    expect(request).toHaveBeenCalledWith('/scrobble', {
      params: { id: 'song1', submission: false, position: 12_500 },
    });
  });

  it('reportPlaybackStopped scrobbles with submission=true and the current time', async () => {
    mockedRequest.mockResolvedValue({});
    vi.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);
    await reportPlaybackStopped('song1');
    expect(request).toHaveBeenCalledWith('/scrobble', {
      params: { id: 'song1', submission: true, time: 1_700_000_000_000 },
    });
    vi.restoreAllMocks();
  });

  it('swallows errors so reporting never breaks playback', async () => {
    mockedRequest.mockRejectedValue(new Error('network'));
    await expect(reportPlaybackStart('song1')).resolves.toBeUndefined();
  });
});
