import { describe, expect, it, vi } from 'vitest';
import { pollJob } from './pollJob';
import type { GrabJob } from './grabTypes';

const wait = () => Promise.resolve();

describe('pollJob', () => {
  it('returns as soon as the job completes', async () => {
    const seq: GrabJob[] = [
      { job_id: 'j', status: 'downloading' },
      { job_id: 'j', status: 'completed' },
    ];
    const fetchJob = vi.fn(() => Promise.resolve(seq.shift()!));
    const result = await pollJob('j', { wait, fetchJob });
    expect(result.status).toBe('completed');
    expect(fetchJob).toHaveBeenCalledTimes(2);
  });

  it('returns on failure', async () => {
    const fetchJob = vi.fn().mockResolvedValue({ job_id: 'j', status: 'failed' });
    const result = await pollJob('j', { wait, fetchJob });
    expect(result.status).toBe('failed');
  });

  it('tolerates transient poll errors within the budget', async () => {
    let n = 0;
    const fetchJob = vi.fn(() => {
      n++;
      if (n < 3) return Promise.reject(new Error('blip'));
      return Promise.resolve({ job_id: 'j', status: 'completed' } as GrabJob);
    });
    const result = await pollJob('j', { wait, fetchJob });
    expect(result.status).toBe('completed');
    expect(fetchJob).toHaveBeenCalledTimes(3);
  });

  it('gives up after maxAttempts, returning the last-known job', async () => {
    const fetchJob = vi.fn().mockResolvedValue({ job_id: 'j', status: 'downloading' });
    const result = await pollJob('j', { wait, fetchJob, maxAttempts: 3 });
    expect(result.status).toBe('downloading');
    expect(fetchJob).toHaveBeenCalledTimes(3);
  });
});
