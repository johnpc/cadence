import { useCallback, useSyncExternalStore } from 'react';
import {
  diagnosticsEnabled,
  setDiagnosticsEnabled,
  diagnosticsEntries,
  clearDiagnostics,
  onDiagnosticsChange,
} from '../../lib/diagnostics/diagnosticsStore';
import {
  diagnosticsUploadEnabled,
  setDiagnosticsUploadEnabled,
  onDiagnosticsUploadChange,
} from '../../lib/diagnostics/diagnosticsUploadStore';
import {
  diagnosticsEndpoint,
  diagnosticsUploadConfigured,
} from '../../lib/diagnostics/diagnosticsConfig';
import { formatEntry } from '../../lib/diagnostics/diagnosticsTypes';

/** Drives the Settings → Diagnostics section: the on-device capture toggle, the
 * upload opt-in, the live entry list, and copy/clear. */
export function useDiagnostics() {
  const enabled = useSyncExternalStore(onDiagnosticsChange, diagnosticsEnabled);
  const uploadEnabled = useSyncExternalStore(onDiagnosticsUploadChange, diagnosticsUploadEnabled);
  const entries = useSyncExternalStore(onDiagnosticsChange, diagnosticsEntries);

  const asText = useCallback(() => entries.map(formatEntry).join('\n'), [entries]);

  return {
    enabled,
    setEnabled: setDiagnosticsEnabled,
    uploadEnabled,
    setUploadEnabled: setDiagnosticsUploadEnabled,
    uploadConfigured: diagnosticsUploadConfigured(),
    endpoint: diagnosticsEndpoint(),
    entries,
    clear: clearDiagnostics,
    asText,
  };
}
