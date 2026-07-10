/**
 * Postinstall fix for @hauxir2/capacitor-chromecast (a GitHub fork).
 *
 * The fork ships its CocoaPods spec as `HauxirCapacitorChromecast.podspec`, but
 * Capacitor derives the expected podspec name from the PACKAGE name — for
 * `@hauxir2/capacitor-chromecast` that's `Hauxir2CapacitorChromecast`. The
 * mismatch makes `npx cap sync ios` fail ("No podspec found"). We copy the spec
 * to the expected filename and fix its `s.name` so the iOS build resolves it.
 *
 * Done as a plain copy (not a patch-package diff) so it's deterministic across
 * environments — a rename-based patch was brittle in CI. Idempotent + a no-op
 * when the package or spec is absent (e.g. a web-only install), never failing
 * the install.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const DIR = 'node_modules/@hauxir2/capacitor-chromecast';
const SRC = `${DIR}/HauxirCapacitorChromecast.podspec`;
const DST = `${DIR}/Hauxir2CapacitorChromecast.podspec`;

try {
  if (!existsSync(SRC) || existsSync(DST)) process.exit(0);
  const fixed = readFileSync(SRC, 'utf8').replace(
    "s.name = 'HauxirCapacitorChromecast'",
    "s.name = 'Hauxir2CapacitorChromecast'",
  );
  writeFileSync(DST, fixed);
  console.log('fix-chromecast-podspec: wrote Hauxir2CapacitorChromecast.podspec');
} catch (err) {
  // Never fail the install over a native-only convenience fix.
  console.warn('fix-chromecast-podspec: skipped —', err.message);
}
