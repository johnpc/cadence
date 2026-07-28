import type { WidgetSnapshot } from './widgetTypes';

/**
 * Hand the "Continue listening" snapshot to the native iOS layer, which writes it
 * to a shared App Group so the WidgetKit extension can render it (the widget
 * process can't run any web code — this JSON is the whole contract). Implemented
 * as a one-way WKScriptMessageHandler post (see MainViewController's
 * "cadenceWidget" handler). Inert on web/Android, where the handler doesn't
 * exist, so it's a safe no-op everywhere but native iOS.
 */
interface WidgetMessageHandler {
  postMessage: (message: unknown) => void;
}

interface WebkitBridge {
  messageHandlers?: { cadenceWidget?: WidgetMessageHandler };
}

/** True when the native widget bridge is present (native iOS). */
export function hasWidgetBridge(): boolean {
  const webkit = (window as unknown as { webkit?: WebkitBridge }).webkit;
  return !!webkit?.messageHandlers?.cadenceWidget;
}

/** Push the snapshot (or null to clear the widget) to native. No-op off native. */
export function pushWidgetSnapshot(snapshot: WidgetSnapshot | null): void {
  const webkit = (window as unknown as { webkit?: WebkitBridge }).webkit;
  const handler = webkit?.messageHandlers?.cadenceWidget;
  if (!handler) return;
  try {
    // Post a JSON string (null → "null") so the native side has one parse path.
    handler.postMessage(JSON.stringify(snapshot));
  } catch {
    /* posting failed — ignore, the widget just keeps its last snapshot */
  }
}
