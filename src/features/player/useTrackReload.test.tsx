import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useTrackReload } from './useTrackReload';

describe('useTrackReload', () => {
  it('bumps the nonce and allows up to maxRetries per track', () => {
    const { result } = renderHook(() => useTrackReload(1));
    expect(result.current.nonce).toBe(0);

    let ok = false;
    act(() => {
      ok = result.current.requestReload('t1');
    });
    expect(ok).toBe(true);
    expect(result.current.nonce).toBe(1);

    // Second retry for the SAME track is over budget (maxRetries=1).
    act(() => {
      ok = result.current.requestReload('t1');
    });
    expect(ok).toBe(false);
    expect(result.current.nonce).toBe(1); // unchanged
  });

  it('resets the retry budget when the track changes', () => {
    const { result } = renderHook(() => useTrackReload(1));
    act(() => void result.current.requestReload('t1'));
    act(() => void result.current.requestReload('t1')); // spent for t1
    // A new track gets a fresh budget.
    let ok = false;
    act(() => {
      ok = result.current.requestReload('t2');
    });
    expect(ok).toBe(true);
  });

  it('resetFor clears the counter for a new track', () => {
    const { result } = renderHook(() => useTrackReload(1));
    act(() => void result.current.requestReload('t1'));
    act(() => result.current.resetFor('t2'));
    let ok = false;
    act(() => {
      ok = result.current.requestReload('t2');
    });
    expect(ok).toBe(true);
  });
});
