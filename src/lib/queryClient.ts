import { QueryClient } from '@tanstack/react-query';
import { isRetryableError } from './jellyfinErrors';

/** App-wide react-query client. All server state (Jellyfin data) lives here.
 *
 * - `staleTime` 30s: data stays fresh across quick navigation, so revisiting a
 *   page you just saw paints instantly from cache instead of refetching (the
 *   biggest lever on perceived "clicking is slow"). Per-query hooks raise this
 *   for rarely-changing data (album/artist metadata, genres).
 * - `gcTime` 10min: cached pages survive long enough that back-navigation is
 *   instant well after you've left them.
 * - Retries transient failures (timeouts, 5xx, network blips) 2x with backoff
 *   so a briefly-overloaded server self-heals — but never a confirmed 401. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 10 * 60_000,
      retry: (failureCount, error) => isRetryableError(error) && failureCount < 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
      refetchOnWindowFocus: false,
    },
  },
});
