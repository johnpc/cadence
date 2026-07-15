/** A per-app-launch session id, so uploaded batches from one run group together
 * (and one device's separate sessions stay distinguishable). Generated once in
 * memory — not persisted — so each launch is its own session. */
let id = '';

function generate(): string {
  // crypto.randomUUID where available; else a timestamp-free random fallback
  // (Math.random is fine — this is a correlation id, not a secret).
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (c && 'randomUUID' in c) return c.randomUUID();
  return `s-${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
}

export function sessionId(): string {
  if (!id) id = generate();
  return id;
}
