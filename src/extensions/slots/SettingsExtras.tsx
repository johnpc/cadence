import { GrabBackend } from '../grab/GrabBackend';

/** Extension settings sections (Music Grabber's server + key). Configuring a
 * Grab server is how that extension is switched on, so it is always offered. */
export function SettingsExtras() {
  return <GrabBackend />;
}
