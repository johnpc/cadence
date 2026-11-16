import { grabJob } from './grabClient';
import { isJobDone, type GrabJob } from './grabTypes';

/** Poll a Music Grabber job until it reaches a terminal state (complete/failed)
 * or the attempt budget runs out. `wait`/`fetchJob` are injectable so tests run
 * without real timers/network. A poll error is treated as transient (keep
 * trying) up to the budget; the last-known job is returned when the budget is
 * exhausted so the caller can decide (surface "still working"). */
export async function pollJob(
  jobId: string,
  {
    maxAttempts = 60,
    intervalMs = 2000,
    wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms)),
    fetchJob = grabJob,
  }: {
    maxAttempts?: number;
    intervalMs?: number;
    wait?: (ms: number) => Promise<void>;
    fetchJob?: (id: string) => Promise<GrabJob>;
  } = {},
): Promise<GrabJob> {
  let last: GrabJob = { job_id: jobId, status: 'queued' };
  for (let i = 0; i < maxAttempts; i++) {
    try {
      last = await fetchJob(jobId);
      if (isJobDone(last)) return last;
    } catch {
      /* transient poll error — keep trying within the budget */
    }
    await wait(intervalMs);
  }
  return last;
}
