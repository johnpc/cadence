import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { markConfigHydrated } from '../../lib/pluginConfigHydration';
import { useStorytellerEnabled } from './useStorytellerEnabled';

afterEach(() => {
  delete window.__CADENCE_CONFIG__;
});

describe('useStorytellerEnabled', () => {
  it('turns on when the plugin config arrives after the screen mounted', () => {
    const { result } = renderHook(() => useStorytellerEnabled());
    expect(result.current).toBe(false);
    window.__CADENCE_CONFIG__ = { storyteller: true };
    act(() => markConfigHydrated());
    expect(result.current).toBe(true);
  });
});
