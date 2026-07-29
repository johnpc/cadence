import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/musicGrabberStore', () => ({
  getMusicGrabberUrl: () => 'https://mg.test',
  getMusicGrabberKey: () => 'secret-key',
}));

import { grabSearch, grabDownload, grabJob } from './grabClient';
import type { GrabResult } from './grabTypes';

function stubFetch(body: unknown, ok = true, status = 200) {
  const f = vi.fn().mockResolvedValue({
    ok,
    status,
    json: () => Promise.resolve(body),
  });
  vi.stubGlobal('fetch', f);
  return f;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

const result: GrabResult = {
  video_id: 'v1',
  title: 'Creep',
  channel: 'Radiohead',
  artist: null,
  duration: 238,
  thumbnail: null,
  source: 'youtube',
  source_url: 'https://youtu.be/v1',
  quality_score: 150,
  is_playlist: false,
  album: null,
};

describe('grabClient', () => {
  it('search posts the query with the X-API-Key header', async () => {
    const f = stubFetch({ results: [result], search_token: 'tok', slskd_enabled: false });
    const res = await grabSearch('radiohead creep');
    const [url, init] = f.mock.calls[0];
    expect(url).toBe('https://mg.test/api/search');
    expect((init.headers as Record<string, string>)['X-API-Key']).toBe('secret-key');
    expect(JSON.parse(init.body as string)).toMatchObject({
      query: 'radiohead creep',
      source: 'youtube',
    });
    expect(res.results).toHaveLength(1);
  });

  it('download posts a single-track flac request with the search token', async () => {
    const f = stubFetch({ job_id: 'j1', status: 'queued' });
    const job = await grabDownload(result, 'tok');
    const body = JSON.parse(f.mock.calls[0][1].body as string);
    expect(body).toMatchObject({
      video_id: 'v1',
      download_type: 'single',
      convert_to_flac: true,
      search_token: 'tok',
      artist: 'Radiohead', // falls back to channel when artist is null
    });
    expect(job.job_id).toBe('j1');
  });

  it('getJob fetches the job by id', async () => {
    const f = stubFetch({ job_id: 'j1', status: 'completed' });
    const job = await grabJob('j1');
    expect(f.mock.calls[0][0]).toBe('https://mg.test/api/jobs/j1');
    expect(job.status).toBe('completed');
  });

  it('throws on a non-2xx response', async () => {
    stubFetch({}, false, 500);
    await expect(grabSearch('x')).rejects.toThrow(/500/);
  });
});
