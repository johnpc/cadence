import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/jellyfinItems', () => ({ getItem: vi.fn() }));
import { getItem } from '../../lib/jellyfinItems';
import { useJumpBackIn } from './useJumpBackIn';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const item = (id: string, Type = 'MusicAlbum'): JellyfinItem => ({ Id: id, Name: id, Type });

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
  return renderHook(() => useJumpBackIn(), { wrapper });
}

beforeEach(() => localStorage.clear());
afterEach(() => {
  localStorage.clear();
  vi.resetAllMocks();
});

describe('useJumpBackIn', () => {
  it('is empty with no recent plays (and does not fetch)', () => {
    const { result } = setup();
    expect(result.current.items).toEqual([]);
    expect(getItem).not.toHaveBeenCalled();
  });

  it('hydrates recent-play ids into items, newest first', async () => {
    localStorage.setItem('cadence.recent-plays', JSON.stringify({ a: 100, b: 300 }));
    vi.mocked(getItem).mockImplementation(async (id: string) => item(id));
    const { result } = setup();
    await waitFor(() => expect(result.current.items).toHaveLength(2));
    // b (ts 300) is newer than a (ts 100) → first.
    expect(result.current.items.map((i) => i.Id)).toEqual(['b', 'a']);
  });

  it('drops ids that fail to resolve (deleted/moved item)', async () => {
    localStorage.setItem('cadence.recent-plays', JSON.stringify({ good: 200, gone: 100 }));
    vi.mocked(getItem).mockImplementation(async (id: string) => {
      if (id === 'gone') throw new Error('404');
      return item(id);
    });
    const { result } = setup();
    await waitFor(() => expect(result.current.items).toHaveLength(1));
    expect(result.current.items[0].Id).toBe('good');
  });
});
