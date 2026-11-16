/**
 * Keeps retrying a session that couldn't be read (`unavailable`) until it can:
 * on a backoff timer, and at once whenever the app returns to the foreground —
 * the moment a phone that launched us while locked is unlocked and opened.
 * One retry at a time; detaching stops everything.
 */

/** Waits between automatic retries; the last one repeats. */
export const RETRY_DELAYS_MS = [1_000, 3_000, 10_000, 30_000];

export function retryDelay(attempt: number): number {
  return RETRY_DELAYS_MS[Math.min(attempt, RETRY_DELAYS_MS.length - 1)];
}

export interface RetryEnv {
  doc: Pick<Document, 'addEventListener' | 'removeEventListener' | 'visibilityState'>;
  setTimer: (fn: () => void, ms: number) => ReturnType<typeof setTimeout>;
  clearTimer: (id: ReturnType<typeof setTimeout>) => void;
}

const browserEnv = (): RetryEnv => ({
  doc: document,
  setTimer: (fn, ms) => setTimeout(fn, ms),
  clearTimer: (id) => clearTimeout(id),
});

export function attachSessionRetry(
  retry: () => Promise<void>,
  env: RetryEnv = browserEnv(),
): () => void {
  let attempt = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let inFlight = false;
  let detached = false;

  const schedule = () => {
    if (detached) return;
    if (timer !== undefined) env.clearTimer(timer);
    timer = env.setTimer(run, retryDelay(attempt++));
  };

  async function run() {
    if (detached || inFlight) return;
    inFlight = true;
    try {
      await retry();
    } catch {
      /* still unavailable — try again later */
    } finally {
      inFlight = false;
      schedule(); // a success detaches us (the status changes), so this no-ops
    }
  }

  // Capacitor fires `resume` on the document when the app is foregrounded; the
  // browser fires `visibilitychange`. Either means "the user is back — try now".
  const onForeground = () => {
    if (env.doc.visibilityState === 'hidden') return;
    void run();
  };
  env.doc.addEventListener('visibilitychange', onForeground);
  env.doc.addEventListener('resume', onForeground);
  schedule();

  return () => {
    detached = true;
    if (timer !== undefined) env.clearTimer(timer);
    env.doc.removeEventListener('visibilitychange', onForeground);
    env.doc.removeEventListener('resume', onForeground);
  };
}
