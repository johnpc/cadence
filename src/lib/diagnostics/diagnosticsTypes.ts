/** One structured diagnostic event. `fields` holds typed key/values (trackId,
 * status, error…) so logs are queryable end-to-end, not raw text; `message` is a
 * short human summary. `source` marks the emitter (web player, native bridge). */
export interface DiagnosticEntry {
  /** Epoch millis when the event happened. */
  ts: number;
  /** Short kebab-ish category, e.g. 'play', 'pause', 'waiting', 'track-load'. */
  category: string;
  /** One-line human summary. */
  message: string;
  /** Typed key/value context. */
  fields: Record<string, string>;
}

/** A single human-readable line for the on-device view/copy, e.g.
 * `12:03:04.120 [pause] unexpected trackId=abc`. */
export function formatEntry(e: DiagnosticEntry): string {
  const t = new Date(e.ts).toISOString().slice(11, 23);
  const rendered = Object.keys(e.fields)
    .sort()
    .map((k) => `${k}=${e.fields[k]}`)
    .join(' ');
  const suffix = rendered ? ` ${rendered}` : '';
  return `${t} [${e.category}] ${e.message}${suffix}`;
}
