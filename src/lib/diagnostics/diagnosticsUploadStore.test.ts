import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  diagnosticsUploadEnabled,
  setDiagnosticsUploadEnabled,
  onDiagnosticsUploadChange,
} from './diagnosticsUploadStore';

beforeEach(() => {
  localStorage.clear();
  // Backend "configured" so the enabled check turns on the upload toggle.
  vi.stubEnv('VITE_DIAGNOSTICS_URL', 'https://logs.example/logs');
  vi.stubEnv('VITE_DIAGNOSTICS_KEY', 'k');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('diagnosticsUploadStore', () => {
  it('is off by default', () => {
    expect(diagnosticsUploadEnabled()).toBe(false);
  });

  it('reflects the opt-in when the backend is configured', () => {
    setDiagnosticsUploadEnabled(true);
    expect(diagnosticsUploadEnabled()).toBe(true);
  });

  it('stays off when the backend is NOT configured, even if opted in', () => {
    setDiagnosticsUploadEnabled(true);
    vi.stubEnv('VITE_DIAGNOSTICS_URL', '');
    expect(diagnosticsUploadEnabled()).toBe(false);
  });

  it('notifies listeners on change', () => {
    const cb = vi.fn();
    const off = onDiagnosticsUploadChange(cb);
    setDiagnosticsUploadEnabled(true);
    expect(cb).toHaveBeenCalledTimes(1);
    off();
  });
});
