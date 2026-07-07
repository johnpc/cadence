/**
 * A stable per-install device identifier. Jellyfin ties sessions/"devices" to
 * the DeviceId in the auth header — a random id per request floods the server's
 * device list, so we generate ONE, persist it in Preferences, and reuse it.
 *
 * ensureDeviceId() runs once at startup and caches the value synchronously so
 * the (sync) auth-header builder can read it without awaiting.
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
