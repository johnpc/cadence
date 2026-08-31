/**
 * Opt the page into WebKit's Managed Media Session ("Audio Session") API:
 * `navigator.audioSession.type = 'playback'` (iOS/Safari 17+).
 *
 * Why this matters: WKWebView only exempts the app from background suspension
 * WHILE its <audio> is audibly playing, with only a ~10s silence grace window.
 * The silent gap between tracks (next stream slow to start over the cloudflared
 * tunnel / transcoder spin-up) can exceed that, and iOS then freezes the whole
 * app mid-track-change — playback dies until the user returns, and Cadence
 * forfeits the OS Now Playing slot (so a Bluetooth reconnect resumes some other
 * app). Declaring the session type 'playback' tells WebKit this page IS a
 * playback app, keeping it alive across those gaps. This exact one-liner is what
 * closed jellyfin-ios's five-year background-audio issue (jellyfin-web #8211).
 *
 * No-op where the API doesn't exist (older iOS, other browsers) — harmless
 * everywhere, so it's applied unconditionally at player boot.
 */
interface AudioSessionNavigator {
  audioSession?: { type: string };
}

/** Declare this page a playback app to WebKit. Returns whether the API existed
 * (logged by the caller for diagnostics). Safe to call repeatedly. */
export function adoptPlaybackAudioSession(): boolean {
  const session = (navigator as Navigator & AudioSessionNavigator).audioSession;
  if (!session) return false;
  try {
    session.type = 'playback';
    return true;
  } catch {
    return false;
  }
}
