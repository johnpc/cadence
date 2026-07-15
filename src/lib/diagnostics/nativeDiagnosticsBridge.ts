/**
 * Lets the iOS native layer record diagnostic events into the SAME on-device log
 * + upload pipeline the web player uses, so native-only events (audio-session
 * (re)activation, interruptions, foreground re-assert) show up alongside the JS
 * events. AppDelegate/MainViewController call
 * `window.__cadenceNativeLog(category, message, fieldsJson)` via evaluateJavaScript;
 * this installs that global. Marked with source=ios so batches/lines are
 * attributable. No-op off native (the global is simply never called).
 */
import { log } from './diagnosticsStore';

interface NativeLogWindow {
  __cadenceNativeLog?: (category: string, message: string, fieldsJson?: string) => void;
}

/** Install the native→JS diagnostics hook. Safe to call once at startup. */
export function initNativeDiagnosticsBridge(): void {
  (window as unknown as NativeLogWindow).__cadenceNativeLog = (category, message, fieldsJson) => {
    const fields: Record<string, string> = { source: 'ios' };
    if (fieldsJson) {
      try {
        const parsed = JSON.parse(fieldsJson) as Record<string, unknown>;
        for (const [k, v] of Object.entries(parsed)) fields[k] = String(v);
        fields.source = 'ios';
      } catch {
        /* malformed fields from native — keep the source-only default */
      }
    }
    log(String(category), String(message), fields);
  };
}
