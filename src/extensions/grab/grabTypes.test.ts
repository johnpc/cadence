import { describe, expect, it } from 'vitest';
import { isJobDone, isJobSuccess, jobId, type GrabJob } from './grabTypes';

const job = (status: string): GrabJob => ({ job_id: 'j', status });

describe('grab job status', () => {
  it('isJobDone for terminal states (completed/failed — verified live)', () => {
    expect(isJobDone(job('completed'))).toBe(true);
    expect(isJobDone(job('failed'))).toBe(true);
    expect(isJobDone(job('downloading'))).toBe(false);
    expect(isJobDone(job('queued'))).toBe(false);
  });
  it('isJobSuccess only for completed', () => {
    expect(isJobSuccess(job('completed'))).toBe(true);
    expect(isJobSuccess(job('failed'))).toBe(false);
  });
});

describe('jobId', () => {
  it('reads job_id (download response) or id (jobs response)', () => {
    expect(jobId({ job_id: 'a', status: 'queued' })).toBe('a');
    expect(jobId({ id: 'b', status: 'completed' })).toBe('b');
    expect(jobId({ status: 'x' })).toBe('');
  });
});
