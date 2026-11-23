import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const hydrated = vi.hoisted(() => ({ value: false }));
vi.mock('../../lib/pluginConfigHydration', () => ({
  usePluginConfigHydrated: () => hydrated.value,
}));
const enabled = vi.hoisted(() => ({ value: false }));
vi.mock('../../extensions/flags', () => ({ isExtensionEnabled: () => enabled.value }));

import {
  latchRequestsTab,
  requestsTab,
  resetRequestsTabSession,
  useRequestsTab,
} from './requestsTab';

describe('requestsTab', () => {
  beforeEach(() => {
    localStorage.clear();
    resetRequestsTabSession();
    hydrated.value = false;
    enabled.value = false;
  });
  afterEach(() => resetRequestsTabSession());

  it('prefers the session latch over the remembered value', () => {
    expect(requestsTab(null, 'shown')).toBe('shown');
    expect(requestsTab('hidden', 'shown')).toBe('hidden');
  });

  it('latches only once the config has settled, and never changes after', () => {
    expect(latchRequestsTab(false, () => true)).toBeNull();
    expect(latchRequestsTab(true, () => true)).toBe('shown');
    expect(latchRequestsTab(true, () => false)).toBe('shown');
  });

  it('starts from the last launch, then holds the settled answer for the session', () => {
    localStorage.setItem('cadence.shell.requestsTab', 'shown');
    const { result, rerender } = renderHook(() => useRequestsTab());
    expect(result.current).toBe(true); // remembered, before hydration

    hydrated.value = true;
    enabled.value = false;
    rerender();
    expect(result.current).toBe(false); // settled answer wins…
    expect(localStorage.getItem('cadence.shell.requestsTab')).toBe('hidden'); // …and is remembered

    enabled.value = true; // a later flip within the session is ignored
    act(() => rerender());
    expect(result.current).toBe(false);
  });
});
