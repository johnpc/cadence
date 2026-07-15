/**
 * One entry point for the diagnostics wiring, imported lazily from main.tsx so it
 * lands in its own chunk (out of the entry bundle — none of it is needed for
 * first paint). Sets up the opt-in remote uploader and the iOS native→JS log
 * bridge; both are inert until the user opts in / native calls the hook.
 */
import { initDiagnosticsUpload } from './diagnosticsUploader';
import { initNativeDiagnosticsBridge } from './nativeDiagnosticsBridge';

export function initDiagnostics(): void {
  initDiagnosticsUpload();
  initNativeDiagnosticsBridge();
}
