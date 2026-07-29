import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useForceOffline } from './useForceOffline';

describe('useForceOffline', () => {
  afterEach(() => localStorage.clear());

  it('reflects the persisted value and updates on set', () => {
    const { result } = renderHook(() => useForceOffline());
    expect(result.current.forceOffline).toBe(false);
    act(() => result.current.setForceOffline(true));
    expect(result.current.forceOffline).toBe(true);
  });
});
