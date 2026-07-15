/**
 * Config for the opt-in diagnostics upload (see the `cadence-logs` backend:
 * API Gateway → Lambda → S3). The endpoint + ingest key are baked in at build
 * time from env; the key is NOT a secret — it only throttles casual abuse of the
 * public write endpoint. Uploads are still opt-in (see diagnosticsStore) and off
 * by default, so nothing leaves the device unless the user enables it.
 */

/** The ingest endpoint, injected at build time (empty when unconfigured). */
export function diagnosticsEndpoint(): string {
  const v = import.meta.env.VITE_DIAGNOSTICS_URL;
  return typeof v === 'string' ? v.trim() : '';
}

/** The (non-secret) ingest API key, injected at build time. */
export function diagnosticsApiKey(): string {
  const v = import.meta.env.VITE_DIAGNOSTICS_KEY;
  return typeof v === 'string' ? v.trim() : '';
}

/** Upload is possible only when BOTH the endpoint and key are configured. When
 * unset (e.g. a fork without the backend), diagnostics stays purely on-device. */
export function diagnosticsUploadConfigured(): boolean {
  return diagnosticsEndpoint() !== '' && diagnosticsApiKey() !== '';
}
