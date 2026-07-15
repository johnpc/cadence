import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  diagnosticsEndpoint,
  diagnosticsApiKey,
  diagnosticsUploadConfigured,
} from './diagnosticsConfig';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('diagnosticsConfig', () => {
  it('reads the endpoint + key from env (trimmed)', () => {
    vi.stubEnv('VITE_DIAGNOSTICS_URL', '  https://logs.example/logs  ');
    vi.stubEnv('VITE_DIAGNOSTICS_KEY', ' k123 ');
    expect(diagnosticsEndpoint()).toBe('https://logs.example/logs');
    expect(diagnosticsApiKey()).toBe('k123');
    expect(diagnosticsUploadConfigured()).toBe(true);
  });

  it('is unconfigured when either is empty', () => {
    vi.stubEnv('VITE_DIAGNOSTICS_URL', '');
    vi.stubEnv('VITE_DIAGNOSTICS_KEY', 'k');
    expect(diagnosticsUploadConfigured()).toBe(false);
    vi.stubEnv('VITE_DIAGNOSTICS_URL', 'https://x');
    vi.stubEnv('VITE_DIAGNOSTICS_KEY', '');
    expect(diagnosticsUploadConfigured()).toBe(false);
  });
});
