import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/jellyfinItems', () => ({ getInstantMix: vi.fn() }));
import { getInstantMix } from '../../lib/jellyfinItems';
import { useEndlessPlay } from './useEndlessPlay';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const t = (id: string): JellyfinItem => ({ Id: id, Name: id, Type: 'Audio' });

describe('useEndlessPlay', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('appends instant-mix radio when at the last track', async () => {
    vi.mocked(getInstantMix).mockResolvedValue([t('b'), t('c')]);
    const append = vi.fn();
    renderHook(() => useEndlessPlay([t('a')], 0, true, append));
    await waitFor(() => expect(append).toHaveBeenCalledWith([t('b'), t('c')]));
    expect(getInstantMix).toHaveBeenCalledWith('a');
  });

  it('drops the seed track if the mix echoes it back', async () => {
    vi.mocked(getInstantMix).mockResolvedValue([t('a'), t('b')]);
    const append = vi.fn();
    renderHook(() => useEndlessPlay([t('a')], 0, true, append));
    await waitFor(() => expect(append).toHaveBeenCalledWith([t('b')]));
  });

  it('does nothing when not at the end', () => {
    const append = vi.fn();
    renderHook(() => useEndlessPlay([t('a'), t('b')], 0, true, append));
    expect(getInstantMix).not.toHaveBeenCalled();
  });

  it('does nothing when repeat is on', () => {
    const append = vi.fn();
    renderHook(() => useEndlessPlay([t('a')], 0, false, append));
    expect(getInstantMix).not.toHaveBeenCalled();
  });

  it('does not re-seed for the same tail track on re-render', async () => {
    vi.mocked(getInstantMix).mockResolvedValue([t('b')]);
    const append = vi.fn();
    const { rerender } = renderHook(({ q }) => useEndlessPlay(q, q.length - 1, true, append), {
      initialProps: { q: [t('a')] },
    });
    await waitFor(() => expect(getInstantMix).toHaveBeenCalledTimes(1));
    rerender({ q: [t('a')] });
    expect(getInstantMix).toHaveBeenCalledTimes(1);
  });
});
