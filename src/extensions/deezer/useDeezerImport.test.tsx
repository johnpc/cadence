import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDeezerImport } from './useDeezerImport';
import * as deezerApi from './deezerApi';
import * as missing from './requestMissingArtist';

vi.mock('../toast/useToast', () => ({ useToast: () => vi.fn() }));

afterEach(() => {
  vi.restoreAllMocks();
});

const RESULT = {
  PlaylistId: 'pl1',
  PlaylistName: 'En mode 60',
  AddedCount: 4,
  TotalCount: 50,
  MissingArtists: ['The Beatles'],
};

describe('useDeezerImport', () => {
  it('runs the import and holds the result', async () => {
    vi.spyOn(deezerApi, 'importDeezerPlaylist').mockResolvedValue(RESULT);
    const { result } = renderHook(() => useDeezerImport());
    await act(async () => {
      await result.current.runImport('908622995');
    });
    expect(result.current.result).toEqual(RESULT);
    expect(result.current.importing).toBe(false);
  });

  it('clears the result and swallows a failed import', async () => {
    vi.spyOn(deezerApi, 'importDeezerPlaylist').mockRejectedValue(new Error('nope'));
    const { result } = renderHook(() => useDeezerImport());
    await act(async () => {
      await result.current.runImport('908622995');
    });
    expect(result.current.result).toBeNull();
  });

  it('marks a missing artist requested on success', async () => {
    vi.spyOn(missing, 'requestMissingArtist').mockResolvedValue();
    const { result } = renderHook(() => useDeezerImport());
    await act(async () => {
      await result.current.request('The Beatles');
    });
    expect(result.current.status['The Beatles']).toBe('requested');
  });

  it('marks a missing artist errored on failure', async () => {
    vi.spyOn(missing, 'requestMissingArtist').mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() => useDeezerImport());
    await act(async () => {
      await result.current.request('Nobody');
    });
    expect(result.current.status['Nobody']).toBe('error');
  });
});
