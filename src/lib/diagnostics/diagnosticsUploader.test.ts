import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../deviceId', () => ({ deviceId: () => 'dev-1' }));
vi.mock('./diagnosticsSession', () => ({ sessionId: () => 'sess-1' }));
vi.mock('../platform', () => ({ isIos: () => true }));

const upload = { enabled: true };
vi.mock('./diagnosticsUploadStore', () => ({
  diagnosticsUploadEnabled: () => upload.enabled,
  onDiagnosticsUploadChange: () => () => {},
}));

let sink: ((e: unknown) => void) | undefined;
vi.mock('./diagnosticsStore', () => ({
  addDiagnosticsSink: (s: (e: unknown) => void) => {
    sink = s;
    return () => {};
  },
}));

import { initDiagnosticsUpload, flushDiagnostics } from './diagnosticsUploader';

beforeEach(() => {
  upload.enabled = true;
  vi.stubEnv('VITE_DIAGNOSTICS_URL', 'https://logs.example/logs');
  vi.stubEnv('VITE_DIAGNOSTICS_KEY', 'k123');
  sink = undefined;
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

function entry(i: number) {
  return { ts: i, category: 'play', message: String(i), fields: {} };
}

describe('diagnosticsUploader', () => {
  it('POSTs a batch (platform + auth header) once the threshold is hit', () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);
    initDiagnosticsUpload();
    for (let i = 0; i < 10; i++) sink?.(entry(i)); // BATCH_SIZE = 10
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://logs.example/logs');
    expect((init as RequestInit).headers).toMatchObject({ 'x-api-key': 'k123' });
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body).toMatchObject({ deviceId: 'dev-1', sessionId: 'sess-1', platform: 'ios' });
    expect(body.records).toHaveLength(10);
  });

  it('does not enqueue or POST when upload is disabled', () => {
    upload.enabled = false;
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    initDiagnosticsUpload();
    for (let i = 0; i < 15; i++) sink?.(entry(i));
    flushDiagnostics();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('flush sends a partial batch below the threshold', () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);
    initDiagnosticsUpload();
    sink?.(entry(1));
    sink?.(entry(2));
    expect(fetchMock).not.toHaveBeenCalled(); // below threshold
    flushDiagnostics();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).records).toHaveLength(2);
  });
});
