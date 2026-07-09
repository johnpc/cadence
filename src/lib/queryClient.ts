import { QueryClient } from '@tanstack/react-query';
import { isRetryableError } from './jellyfinErrors';

/** App-wide react-query client. All server state (Jellyfin data) lives here.
 * Retries transient failures (timeouts, 5xx, network blips) up to 2x with
 * exponential backoff so a briefly-overloaded server self-heals without the UI
 * getting stuck — but never retries a confirmed 401 (a dead session). */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => isRetryableError(error) && failureCount < 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
      refetchOnWindowFocus: false,
    },
  },
});
