import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./downloadStore', () => ({ isDownloaded: vi.fn(), localArtUrl: vi.fn() }));
import { isDownloaded, localArtUrl } from './downloadStore';
import { useLocalArt } from './useLocalArt';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const item = (id: string): JellyfinItem => ({ Id: id, Name: id, Type: 'Audio' });

afterEach(() => {
  vi.resetAllMocks();
});

describe('useLocalArt', () => {
  it('returns null for a non-downloaded item (falls back to network art)', async () => {
    vi.mocked(isDownloaded).mockReturnValue(false);
    const { result } = renderHook(() => useLocalArt(item('a')));
    expect(result.current).toBeNull();
    expect(localArtUrl).not.toHaveBeenCalled();
  });

  it('resolves the cached art blob url for a downloaded item', async () => {
    vi.mocked(isDownloaded).mockReturnValue(true);
    vi.mocked(localArtUrl).mockResolvedValue('blob:art');
    const { result } = renderHook(() => useLocalArt(item('a')));
    await waitFor(() => expect(result.current).toBe('blob:art'));
    expect(localArtUrl).toHaveBeenCalledWith('a');
  });

  it('returns null when the item is null', () => {
    const { result } = renderHook(() => useLocalArt(null));
    expect(result.current).toBeNull();
  });
});
