/**
 * The diagnostics store: an opt-in flag + a bounded ring buffer of recent player
 * events. `log()` is always cheap and safe to call from anywhere; it no-ops
 * unless the user has enabled diagnostics (Settings), so instrumentation can be
 * sprinkled freely without cost when off. When on, entries are kept on-device
 * (for the Settings viewer/copy) and handed to any registered sink (the opt-in
 * uploader — see diagnosticsUploader).
 */
import type { DiagnosticEntry } from './diagnosticsTypes';

const ENABLED_KEY = 'cadence.diagnostics';
const MAX_ENTRIES = 500;

const buffer: DiagnosticEntry[] = [];
const changeListeners = new Set<() => void>();
const sinks = new Set<(e: DiagnosticEntry) => void>();

// Ambient context merged into every log line's fields (per-event fields win) —
// so every event carries the current track + platform without threading it
// through each call site. Set by the player as the track/platform change.
let context: Record<string, string> = {};

/** Merge/replace ambient fields present on every subsequent log line (e.g. the
 * current track title/artist/id). Pass {} to clear. */
export function setLogContext(next: Record<string, string>): void {
  context = { ...next };
}

// A cached immutable snapshot of the buffer. useSyncExternalStore requires
// getSnapshot to return a STABLE reference between changes (else it loops), so we
// only rebuild this when the buffer actually mutates.
let snapshot: readonly DiagnosticEntry[] = [];

function refreshSnapshot(): void {
  snapshot = buffer.slice();
}

/** Diagnostics is OFF unless explicitly enabled. */
export function diagnosticsEnabled(): boolean {
  return localStorage.getItem(ENABLED_KEY) === 'on';
}

export function setDiagnosticsEnabled(on: boolean): void {
  localStorage.setItem(ENABLED_KEY, on ? 'on' : 'off');
  changeListeners.forEach((l) => l());
}

/** Record an event when diagnostics is enabled; a no-op otherwise. `now` is
 * injectable for tests. Never throws — logging must never break playback. */
export function log(
  category: string,
  message: string,
  fields: Record<string, string> = {},
  now: number = Date.now(),
): void {
  if (!diagnosticsEnabled()) return;
  // Ambient context first so explicit per-event fields override it on conflict.
  const entry: DiagnosticEntry = { ts: now, category, message, fields: { ...context, ...fields } };
  buffer.push(entry);
  if (buffer.length > MAX_ENTRIES) buffer.shift();
  refreshSnapshot();
  changeListeners.forEach((l) => l());
  sinks.forEach((s) => {
    try {
      s(entry);
    } catch {
      /* a sink must never break logging */
    }
  });
}

/** A stable snapshot of the current buffer (oldest first). Reference changes only
 * when the buffer mutates — safe for useSyncExternalStore. */
export function diagnosticsEntries(): readonly DiagnosticEntry[] {
  return snapshot;
}

/** Drop all buffered entries (the Settings "Clear" action). */
export function clearDiagnostics(): void {
  buffer.length = 0;
  refreshSnapshot();
  changeListeners.forEach((l) => l());
}

/** Subscribe to buffer/enabled changes (Settings viewer live-updates). */
export function onDiagnosticsChange(listener: () => void): () => void {
  changeListeners.add(listener);
  return () => changeListeners.delete(listener);
}

/** Register a sink that receives each new entry (the uploader). */
export function addDiagnosticsSink(sink: (e: DiagnosticEntry) => void): () => void {
  sinks.add(sink);
  return () => sinks.delete(sink);
}
