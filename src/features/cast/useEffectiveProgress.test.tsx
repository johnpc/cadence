import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const cast = { connected: false };
vi.mock('./useCast', () => ({ useCast: () => cast }));
const castProg = { position: 0, duration: 0 };
vi.mock('./useCastProgress', () => ({ useCastProgress: () => castProg }));

import { useEffectiveProgress } from './useEffectiveProgress';

describe('useEffectiveProgress', () => {
  afterEach(() => {
    cast.connected = false;
    castProg.position = 0;
    castProg.duration = 0;
  });

  it('uses the local element position when not casting', () => {
    const { result } = renderHook(() => useEffectiveProgress(12, 180));
    expect(result.current).toEqual({ position: 12, duration: 180 });
  });

  it('uses the receiver position while casting', () => {
    cast.connected = true;
    castProg.position = 55;
    castProg.duration = 200;
    const { result } = renderHook(() => useEffectiveProgress(12, 180));
    expect(result.current).toEqual({ position: 55, duration: 200 });
  });
});
