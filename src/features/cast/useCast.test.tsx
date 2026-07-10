import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

const { isCastAvailable, castTrack, stopCast } = vi.hoisted(() => ({
  isCastAvailable: vi.fn(() => true),
  castTrack: vi.fn().mockResolvedValue(undefined),
  stopCast: vi.fn(),
}));
vi.mock('./castController', () => ({ isCastAvailable, castTrack, stopCast }));
import { useCast } from './useCast';
import { setCastState } from './castStore';
import { ToastContext } from '../toast/ToastContext';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const toast = vi.fn();
const wrapper = ({ children }: { children: ReactNode }) => (
  <ToastContext.Provider value={toast}>{children}</ToastContext.Provider>
);
const track = { Id: 't1', Name: 'x' } as JellyfinItem;

describe('useCast', () => {
  afterEach(() => {
    vi.clearAllMocks();
    setCastState({ connected: false, deviceName: '', playing: false });
  });

  it('exposes availability and reacts to connection state', () => {
    const { result } = renderHook(() => useCast(), { wrapper });
    expect(result.current.available).toBe(true);
    expect(result.current.connected).toBe(false);
    act(() => setCastState({ connected: true, deviceName: 'Shield', playing: true }));
    expect(result.current.connected).toBe(true);
    expect(result.current.deviceName).toBe('Shield');
  });

  it('casts the given track', async () => {
    const { result } = renderHook(() => useCast(), { wrapper });
    await act(async () => {
      await result.current.cast(track);
    });
    expect(castTrack).toHaveBeenCalledWith(track);
  });

  it('does nothing when asked to cast a null track', async () => {
    const { result } = renderHook(() => useCast(), { wrapper });
    await act(async () => {
      await result.current.cast(null);
    });
    expect(castTrack).not.toHaveBeenCalled();
  });

  it('toasts when connecting fails', async () => {
    castTrack.mockRejectedValueOnce(new Error('no device'));
    const { result } = renderHook(() => useCast(), { wrapper });
    await act(async () => {
      await result.current.cast(track);
    });
    await waitFor(() => expect(toast).toHaveBeenCalledWith("Couldn't connect to a TV"));
  });

  it('stop delegates to the controller', () => {
    const { result } = renderHook(() => useCast(), { wrapper });
    act(() => result.current.stop());
    expect(stopCast).toHaveBeenCalledOnce();
  });
});
