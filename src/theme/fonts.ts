/**
 * Brand font, bundled via fontsource (not a CDN) so the app works offline
 * inside Capacitor. Only the weights the UI uses are imported, to keep the
 * bundle lean.
 *
 * - Libre Franklin (sans): the whole UI — Spotify-style bold sans hierarchy.
 *
 * Newsreader (serif) is kept as a token fallback but not bundled; the music UI
 * is sans-only.
 *
 * SUBSETS: import only `latin` + `latin-ext` (covers English + all accented
 * Western-European names — é, ñ, ö, ř, ł…). The full per-weight CSS also pulls
 * cyrillic / cyrillic-ext / greek / vietnamese — subsets a browser only
 * DOWNLOADS on demand via unicode-range, but which the PWA's Workbox precache
 * (its woff2 glob) bundles unconditionally: 20 woff2 files (~212KB), of which 12
 * are non-Western dead weight. Scoping to latin+latin-ext precaches just 8.
 */

// Libre Franklin — 400 (body/meta), 500 (byline), 600 (labels), 700 (headlines),
// latin + latin-ext subsets only (see above).
import '@fontsource/libre-franklin/latin-400.css';
import '@fontsource/libre-franklin/latin-ext-400.css';
import '@fontsource/libre-franklin/latin-500.css';
import '@fontsource/libre-franklin/latin-ext-500.css';
import '@fontsource/libre-franklin/latin-600.css';
import '@fontsource/libre-franklin/latin-ext-600.css';
import '@fontsource/libre-franklin/latin-700.css';
import '@fontsource/libre-franklin/latin-ext-700.css';
