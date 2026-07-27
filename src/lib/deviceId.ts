/**
 * A stable per-install device identifier. Subsonic auth has no server-side
 * session keyed by device — the id is only used to tag this install's
 * diagnostics events, so we generate ONE, persist it in Preferences, and
 * reuse it rather than mint a fresh one per launch.
 *
 * ensureDeviceId() runs once at startup and caches the value synchronously so
 * callers can read it without awaiting.
 */
import { Preferences } from '@capacitor/preferences';

const KEY = 'cadence.device-id';
let cached = 'cadence-web';

function generate(): string {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  // Deterministic-enough fallback for environments without crypto (rare).
  return `cadence-${Date.now().toString(36)}${Math.floor(performance.now()).toString(36)}`;
}

/** Load-or-create the persisted device id; caches it for deviceId(). */
export async function ensureDeviceId(): Promise<string> {
  const { value } = await Preferences.get({ key: KEY });
  if (value) {
    cached = value;
    return value;
  }
  const created = generate();
  await Preferences.set({ key: KEY, value: created });
  cached = created;
  return created;
}

/** The cached device id (valid after ensureDeviceId() has resolved once). */
export function deviceId(): string {
  return cached;
}
