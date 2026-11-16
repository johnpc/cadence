/**
 * The "Upload diagnostics" opt-in, kept SEPARATE from the on-device diagnostics
 * enable: a user can capture logs locally (to view/copy) without ever uploading.
 * Upload is OFF by default and only meaningful when the backend is configured.
 */
import { createStoredValue } from '../store';
import { diagnosticsUploadConfigured } from './diagnosticsConfig';

const uploadChoice = createStoredValue({
  key: 'cadence.diagnostics.upload',
  parse: (raw) => raw === 'on',
  serialize: (on: boolean) => (on ? 'on' : 'off'),
});

/** Upload is on only when this build has an ingest endpoint AND the user opted in. */
export const diagnosticsUploadEnabled = (): boolean =>
  diagnosticsUploadConfigured() && uploadChoice.get();

export const setDiagnosticsUploadEnabled = (on: boolean): void => uploadChoice.set(on);

export const onDiagnosticsUploadChange = (listener: () => void): (() => void) =>
  uploadChoice.subscribe(listener);
