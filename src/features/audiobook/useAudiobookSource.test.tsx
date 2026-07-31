import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./audiobookSource', () => ({
  audiobookSourceEnabled: vi.fn(),
  fetchAudiobookLibrary: vi.fn(),
}));
vi.mock('../../lib/pluginConfigStore', () => ({ usePluginConfigHydrated: vi.fn(() => true) }));
import { audiobookSourceEnabled, fetchAudiobookLibrary } from './audiobookSource';
import { usePluginConfigHydrated } from '../../lib/pluginConfigStore';
import { useAudiobookSource } from './useAudiobookSource';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
  return renderHook(() => useAudiobookSource(), { wrapper });
}

beforeEach(() => {
  vi.mocked(usePluginConfigHydrated).mockReturnValue(true);
});
afterEach(() => {
  vi.resetAllMocks();
});

describe('useAudiobookSource', () => {
  it('stays active + loading (native suppressed) while plugin config has not hydrated', () => {
    vi.mocked(usePluginConfigHydrated).mockReturnValue(false);
    vi.mocked(audiobookSourceEnabled).mockReturnValue(false);
    const { result } = setup();
    // Before hydration we don't know the plugin is absent — keep active (so the
    // native scan won't race) and report loading, with no fetch yet.
    expect(result.current.active).toBe(true);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isError).toBe(false);
    expect(fetchAudiobookLibrary).not.toHaveBeenCalled();
  });

  it('is inactive and never fetches when the plugin flag is off', () => {
    vi.mocked(audiobookSourceEnabled).mockReturnValue(false);
    const { result } = setup();
    expect(result.current.active).toBe(false);
    expect(result.current.data).toBeNull();
    expect(fetchAudiobookLibrary).not.toHaveBeenCalled();
  });

  it('fetches and returns the precomputed library when active', async () => {
    const lib: JellyfinItem[] = [{ Id: 'a', Name: 'Dune', Type: 'AudioBook' }];
    vi.mocked(audiobookSourceEnabled).mockReturnValue(true);
    vi.mocked(fetchAudiobookLibrary).mockResolvedValue(lib);
    const { result } = setup();
    await waitFor(() => expect(result.current.data).not.toBeNull());
    expect(result.current.active).toBe(true);
    expect(result.current.data?.[0].Id).toBe('a');
    expect(result.current.isError).toBe(false);
  });

  it('surfaces null data + isError on failure (so the caller falls back to native)', async () => {
    vi.mocked(audiobookSourceEnabled).mockReturnValue(true);
    vi.mocked(fetchAudiobookLibrary).mockRejectedValue(new Error('plugin down'));
    const { result } = setup();
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeNull();
  });

  it('refetch re-runs the query (pull-to-refresh)', async () => {
    vi.mocked(audiobookSourceEnabled).mockReturnValue(true);
    vi.mocked(fetchAudiobookLibrary).mockResolvedValue([]);
    const { result } = setup();
    await waitFor(() => expect(result.current.data).not.toBeNull());
    result.current.refetch();
    await waitFor(() => expect(fetchAudiobookLibrary).toHaveBeenCalledTimes(2));
  });
});
