/**
 * Lightweight platform checks. Kept dependency-free (no Capacitor import) so it
 * works identically in the browser PWA and the native WKWebView build.
 */

/** True on iOS/iPadOS (Safari or a WKWebView-hosted app). Detects iPhone/iPad
 * plus iPadOS 13+, which reports as "Macintosh" but is touch-capable. */
export function isIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  // iPadOS 13+ masquerades as macOS; distinguish by touch support.
  return ua.includes('Macintosh') && navigator.maxTouchPoints > 1;
}

/** True where `HTMLMediaElement.volume` is read-only and software volume can't
 * be set — iOS only exposes hardware volume, so a volume slider does nothing. */
export function hasSoftwareVolume(): boolean {
  return !isIos();
}
