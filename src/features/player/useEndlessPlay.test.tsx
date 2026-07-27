import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/navidromeItems', () => ({ getSimilarSongs: vi.fn() }));
import { getSimilarSongs } from '../../lib/navidromeItems';
import { useEndlessPlay } from './useEndlessPlay';
import type { MediaItem } from '../../lib/navidromeTypes';

const t = (id: string): MediaItem => ({ Id: id, Name: id, Type: 'Audio' });

describe('useEndlessPlay', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('appends instant-mix radio when at the last track', async () => {
    vi.mocked(getSimilarSongs).mockResolvedValue([t('b'), t('c')]);
    const append = vi.fn();
    renderHook(() => useEndlessPlay([t('a')], 0, true, append));
    await waitFor(() => expect(append).toHaveBeenCalledWith([t('b'), t('c')]));
    expect(getSimilarSongs).toHaveBeenCalledWith('a');
  });

  it('drops the seed track if the mix echoes it back', async () => {
    vi.mocked(getSimilarSongs).mockResolvedValue([t('a'), t('b')]);
    const append = vi.fn();
    renderHook(() => useEndlessPlay([t('a')], 0, true, append));
    await waitFor(() => expect(append).toHaveBeenCalledWith([t('b')]));
  });

  it('does nothing when not at the end', () => {
    const append = vi.fn();
    renderHook(() => useEndlessPlay([t('a'), t('b')], 0, true, append));
    expect(getSimilarSongs).not.toHaveBeenCalled();
  });

  it('does nothing when repeat is on', () => {
    const append = vi.fn();
    renderHook(() => useEndlessPlay([t('a')], 0, false, append));
    expect(getSimilarSongs).not.toHaveBeenCalled();
  });

  it('does not re-seed for the same tail track on re-render', async () => {
    vi.mocked(getSimilarSongs).mockResolvedValue([t('b')]);
    const append = vi.fn();
    const { rerender } = renderHook(({ q }) => useEndlessPlay(q, q.length - 1, true, append), {
      initialProps: { q: [t('a')] },
    });
    await waitFor(() => expect(getSimilarSongs).toHaveBeenCalledTimes(1));
    rerender({ q: [t('a')] });
    expect(getSimilarSongs).toHaveBeenCalledTimes(1);
  });
});
