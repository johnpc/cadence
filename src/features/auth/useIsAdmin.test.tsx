import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/jellyfinFetch', () => ({ request: vi.fn() }));
import { request } from '../../lib/jellyfinFetch';
import { setSession } from '../../lib/sessionStore';
import { useIsAdmin } from './useIsAdmin';

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return createElement(QueryClientProvider, { client }, children);
}

afterEach(() => {
  setSession(null);
  vi.resetAllMocks();
});

describe('useIsAdmin', () => {
  it('is false when signed out (no query fires)', () => {
    const { result } = renderHook(() => useIsAdmin(), { wrapper });
    expect(result.current).toBe(false);
    expect(request).not.toHaveBeenCalled();
  });

  it('is true when /Users/Me reports IsAdministrator', async () => {
    setSession({ token: 't', userId: 'u' });
    vi.mocked(request).mockResolvedValue({
      Id: 'u',
      Name: 'John',
      Policy: { IsAdministrator: true },
    });
    const { result } = renderHook(() => useIsAdmin(), { wrapper });
    await waitFor(() => expect(result.current).toBe(true));
  });

  it('is false for a non-admin user', async () => {
    setSession({ token: 't', userId: 'u' });
    vi.mocked(request).mockResolvedValue({
      Id: 'u',
      Name: 'guest',
      Policy: { IsAdministrator: false },
    });
    const { result } = renderHook(() => useIsAdmin(), { wrapper });
    await waitFor(() => expect(request).toHaveBeenCalled());
    expect(result.current).toBe(false);
  });
});
