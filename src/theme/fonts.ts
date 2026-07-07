/**
 * Brand font, bundled via fontsource (not a CDN) so the app works offline
 * inside Capacitor. Only the weights the UI uses are imported, to keep the
 * bundle lean.
 *
 * - Libre Franklin (sans): the whole UI — Spotify-style bold sans hierarchy.
 *
 * Newsreader (serif) is kept as a token fallback but not bundled; the music UI
 * is sans-only.
 */

// Libre Franklin — 400 (body/meta), 500 (byline), 600 (labels), 700 (headlines)
import '@fontsource/libre-franklin/400.css';
import '@fontsource/libre-franklin/500.css';
import '@fontsource/libre-franklin/600.css';
import '@fontsource/libre-franklin/700.css';
