/**
 * The "Upload diagnostics" opt-in, kept SEPARATE from the on-device diagnostics
 * enable: a user can capture logs locally (to view/copy) without ever uploading.
 * Upload is OFF by default and only meaningful when the backend is configured.
 */
import { diagnosticsUploadConfigured } from './diagnosticsConfig';

const UPLOAD_KEY = 'cadence.diagnostics.upload';

const listeners = new Set<() => void>();

/** True only when the user opted into upload AND the backend is configured. */
export function diagnosticsUploadEnabled(): boolean {
  return diagnosticsUploadConfigured() && localStorage.getItem(UPLOAD_KEY) === 'on';
}

export function setDiagnosticsUploadEnabled(on: boolean): void {
  localStorage.setItem(UPLOAD_KEY, on ? 'on' : 'off');
  listeners.forEach((l) => l());
}

export function onDiagnosticsUploadChange(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
