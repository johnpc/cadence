import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useEffectiveOffline } from './useEffectiveOffline';
import { markReachable, markUnreachable, __resetReachability } from '../../lib/reachabilityStore';
import { writeForceOffline } from '../settings/forceOfflineStore';

describe('useEffectiveOffline', () => {
  afterEach(() => {
    __resetReachability();
    localStorage.clear();
  });

  it('is false while online and not forced', () => {
    const { result } = renderHook(() => useEffectiveOffline());
    act(() => markReachable());
    expect(result.current).toBe(false);
  });

  it('is true when the server is unreachable', () => {
    const { result } = renderHook(() => useEffectiveOffline());
    act(() => markUnreachable());
    expect(result.current).toBe(true);
  });

  it('is true when offline mode is forced, even while online', () => {
    const { result } = renderHook(() => useEffectiveOffline());
    act(() => markReachable());
    act(() => writeForceOffline(true));
    expect(result.current).toBe(true);
  });

  it('stays false during the launch pending window', () => {
    const { result } = renderHook(() => useEffectiveOffline());
    expect(result.current).toBe(false); // pending, not offline
  });
});
