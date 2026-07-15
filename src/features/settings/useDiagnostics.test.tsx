import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDiagnostics } from './useDiagnostics';
import {
  log,
  clearDiagnostics,
  setDiagnosticsEnabled,
} from '../../lib/diagnostics/diagnosticsStore';

beforeEach(() => {
  localStorage.clear();
  clearDiagnostics();
  vi.stubEnv('VITE_DIAGNOSTICS_URL', 'https://logs.example/logs');
  vi.stubEnv('VITE_DIAGNOSTICS_KEY', 'k');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('useDiagnostics', () => {
  it('reflects enable + captured entries live and renders them as text', () => {
    const { result } = renderHook(() => useDiagnostics());
    expect(result.current.enabled).toBe(false);
    expect(result.current.uploadConfigured).toBe(true);
    expect(result.current.endpoint).toBe('https://logs.example/logs');

    act(() => setDiagnosticsEnabled(true));
    expect(result.current.enabled).toBe(true);

    act(() => log('play', 'started', { id: 't1' }, 0));
    expect(result.current.entries).toHaveLength(1);
    expect(result.current.asText()).toContain('[play] started id=t1');
  });
});
