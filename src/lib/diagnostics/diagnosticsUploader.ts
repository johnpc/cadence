/**
 * Opt-in remote uploader for diagnostics. Batches entries and flushes on a size
 * threshold or when the page hides (visibilitychange) — player events are sparse,
 * so lifecycle flushes are what actually get logs off the device. Off unless the
 * user enabled the separate "Upload diagnostics" toggle AND the backend is
 * configured (endpoint + key baked in at build). Tags each batch with the
 * platform (web/ios) so the dual-source logs are distinguishable server-side.
 */
import { deviceId } from '../deviceId';
import { sessionId } from './diagnosticsSession';
import { isIos } from '../platform';
import { diagnosticsEndpoint, diagnosticsApiKey } from './diagnosticsConfig';
import { addDiagnosticsSink } from './diagnosticsStore';
import { diagnosticsUploadEnabled } from './diagnosticsUploadStore';
import type { DiagnosticEntry } from './diagnosticsTypes';

const APP_VERSION = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '0.0.0';
const BATCH_SIZE = 10;

let pending: DiagnosticEntry[] = [];

function post(batch: DiagnosticEntry[]): void {
  const body = JSON.stringify({
    deviceId: deviceId(),
    sessionId: sessionId(),
    appVersion: APP_VERSION,
    platform: isIos() ? 'ios' : 'web',
    records: batch.map((e) => ({
      ts: e.ts,
      category: e.category,
      message: e.message,
      fields: e.fields,
    })),
  });
  // keepalive lets the POST survive a page-hide/unload flush.
  void fetch(diagnosticsEndpoint(), {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': diagnosticsApiKey() },
    body,
    keepalive: true,
  }).catch(() => undefined);
}

/** Send whatever is buffered (call on visibility-hidden and threshold). */
export function flushDiagnostics(): void {
  if (pending.length === 0 || !diagnosticsUploadEnabled()) return;
  const batch = pending;
  pending = [];
  post(batch);
}

/** Wire the uploader to the store + page lifecycle. Idempotent enough for one
 * call at startup. Only enqueues when upload is enabled; the flush re-checks. */
export function initDiagnosticsUpload(): void {
  addDiagnosticsSink((entry) => {
    if (!diagnosticsUploadEnabled()) return;
    pending.push(entry);
    if (pending.length >= BATCH_SIZE) flushDiagnostics();
  });
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flushDiagnostics();
    });
  }
}
