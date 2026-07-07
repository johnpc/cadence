import { QueryClient } from '@tanstack/react-query';

/** App-wide react-query client. All server state (Jellyfin data) lives here. */
export const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});
