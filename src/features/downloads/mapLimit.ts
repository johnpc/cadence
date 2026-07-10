/**
 * Run an async `task` over `items` with at most `limit` in flight at once,
 * invoking `onEach` as each one settles (for progress). Downloads are heavy
 * (each fetches a whole audio file), so a small concurrency cap avoids hammering
 * the server / saturating the connection while still being faster than serial.
 *
 * Failures don't abort the batch — a single track that won't download shouldn't
 * sink the rest; `onEach(ok)` reports whether each item succeeded.
 */
export async function mapLimit<T>(
  items: T[],
  limit: number,
  task: (item: T) => Promise<void>,
  onEach?: (ok: boolean) => void,
): Promise<void> {
  let cursor = 0;
  const worker = async (): Promise<void> => {
    while (cursor < items.length) {
      const item = items[cursor++];
      try {
        await task(item);
        onEach?.(true);
      } catch {
        onEach?.(false);
      }
    }
  };
  const workers = Array.from({ length: Math.min(limit, items.length) }, worker);
  await Promise.all(workers);
}
