import { formatEntry } from '../../lib/diagnostics/diagnosticsTypes';
import type { DiagnosticEntry } from '../../lib/diagnostics/diagnosticsTypes';
import './diagnostics.css';

/** The captured events, newest last, in a scrollable monospace panel. Shows a
 * hint when empty so it's clear capture is on but nothing has happened yet. */
export function DiagnosticsLog({ entries }: { entries: readonly DiagnosticEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="cad-meta diagnostics__empty" data-testid="diagnostics-empty">
        No events captured yet — play something and they’ll appear here.
      </p>
    );
  }
  return (
    <pre className="diagnostics__log" data-testid="diagnostics-log">
      {entries.map((e, i) => (
        <div key={i} className="diagnostics__line">
          {formatEntry(e)}
        </div>
      ))}
    </pre>
  );
}
