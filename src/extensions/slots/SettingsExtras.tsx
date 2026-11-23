import { GrabBackend } from '../grab/GrabBackend';
import { getSession } from '../../lib/sessionStore';
import { musicGrabberConfigured } from '../../lib/musicGrabberStore';

/** Extension settings sections (Music Grabber's server + key). Configuring a
 * Grab server is how that extension is switched on — server plumbing, so it is
 * offered to Jellyfin admins (and to anyone who already set one up, so it can be
 * changed or cleared), not to every listener. */
export function SettingsExtras() {
  const offer = getSession()?.isAdmin === true || musicGrabberConfigured();
  return offer ? <GrabBackend /> : null;
}
