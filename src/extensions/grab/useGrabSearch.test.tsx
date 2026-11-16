import { renderHook, act } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./grabClient', () => ({ grabSearch: vi.fn() }));
import { grabSearch } from './grabClient';
import { useGrabSearch } from './useGrabSearch';
import type { GrabResult } from './grabTypes';

type SearchResponse = Awaited<ReturnType<typeof grabSearch>>;

const track = (id: string, playlist = false): GrabResult =>
  ({ video_id: id, title: id, is_playlist: playlist, quality_score: 100 }) as GrabResult;

afterEach(() => {
  vi.resetAllMocks();
});

describe('useGrabSearch', () => {
  it('filters out playlist results and keeps the search token', async () => {
    vi.mocked(grabSearch).mockResolvedValue({
      results: [track('a'), track('pl', true), track('b')],
      search_token: 'tok',
      slskd_enabled: false,
    });
    const { result } = renderHook(() => useGrabSearch());
    await act(() => result.current.run('creep'));
    expect(result.current.results.map((r) => r.video_id)).toEqual(['a', 'b']);
    expect(result.current.token).toBe('tok');
    expect(result.current.error).toBe(false);
  });

  it('sets error on failure', async () => {
    vi.mocked(grabSearch).mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useGrabSearch());
    await act(() => result.current.run('x'));
    expect(result.current.error).toBe(true);
    expect(result.current.results).toEqual([]);
  });

  it('ignores a blank query', async () => {
    const { result } = renderHook(() => useGrabSearch());
    await act(() => result.current.run('   '));
    expect(grabSearch).not.toHaveBeenCalled();
    expect(result.current.searched).toBe(false);
  });

  it('drops a slow earlier search that answers after a newer one', async () => {
    let first!: (v: SearchResponse) => void;
    vi.mocked(grabSearch)
      .mockImplementationOnce(() => new Promise<SearchResponse>((res) => (first = res)))
      .mockResolvedValueOnce({ results: [track('new')], search_token: 't2', slskd_enabled: false });
    const { result } = renderHook(() => useGrabSearch());
    let slow!: Promise<void>;
    act(() => {
      slow = result.current.run('old');
    });
    expect(result.current.loading).toBe(true);
    await act(() => result.current.run('new'));
    await act(async () => {
      first({ results: [track('old')], search_token: 't1', slskd_enabled: false });
      await slow;
    });
    expect(result.current.results.map((r) => r.video_id)).toEqual(['new']);
    expect(result.current.token).toBe('t2');
  });

  it('drops a stale failure that lands after a newer search', async () => {
    let fail!: (e: Error) => void;
    vi.mocked(grabSearch)
      .mockImplementationOnce(() => new Promise<SearchResponse>((_, rej) => (fail = rej)))
      .mockResolvedValueOnce({ results: [track('ok')], search_token: 't', slskd_enabled: false });
    const { result } = renderHook(() => useGrabSearch());
    let slow!: Promise<void>;
    act(() => {
      slow = result.current.run('old');
    });
    await act(() => result.current.run('new'));
    await act(async () => {
      fail(new Error('late'));
      await slow;
    });
    expect(result.current.error).toBe(false);
    expect(result.current.state.kind).toBe('results');
  });
});
