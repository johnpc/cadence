#!/usr/bin/env node
/**
 * iOS boot-integrity guard. A storyboard's `customClass="X" customModule="App"`
 * is resolved at RUNTIME — if class X isn't actually compiled into the app, the
 * initial view controller silently falls back to a bare UIViewController, the
 * Capacitor bridge + WKWebView never start, and the app shows a BLACK SCREEN on
 * launch. This is NOT a compile/archive error (the archive succeeds), so nothing
 * else in CI catches it — it took a user hitting a black screen to find it once
 * (MainViewController.swift was referenced by the storyboard but never added to
 * project.pbxproj's Sources build phase).
 *
 * This check fails the build when a storyboard references an App-module custom
 * class whose `<Class>.swift` is not registered in the Sources build phase of
 * project.pbxproj. Cheap + static — no Xcode/simulator needed.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const IOS_APP = join(process.cwd(), 'ios', 'App', 'App');
const PBXPROJ = join(process.cwd(), 'ios', 'App', 'App.xcodeproj', 'project.pbxproj');

// No iOS project checked out (e.g. web-only clone) → nothing to verify.
if (!existsSync(PBXPROJ)) {
  console.log('✓ iOS storyboard classes: no iOS project present, skipping.');
  process.exit(0);
}

/** @returns {string[]} absolute paths of every .storyboard under the App dir */
function storyboards(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...storyboards(full));
    else if (entry.name.endsWith('.storyboard')) out.push(full);
  }
  return out;
}

const pbxproj = readFileSync(PBXPROJ, 'utf8');
// A Swift file counts as compiled only if it appears "<Name>.swift in Sources"
// (the PBXSourcesBuildPhase entry) — being on disk or merely referenced is not
// enough, which is exactly the trap that shipped the black screen.
const compiled = new Set(
  [...pbxproj.matchAll(/([A-Za-z0-9_]+)\.swift in Sources/g)].map((m) => m[1]),
);

const missing = [];
for (const sb of storyboards(IOS_APP)) {
  const xml = readFileSync(sb, 'utf8');
  // Match the App-module custom classes (customModule="App"); the module attr can
  // sit before or after customClass, so scan each element that has both.
  for (const m of xml.matchAll(/customClass="([^"]+)"/g)) {
    const cls = m[1];
    // Only App-module classes must be in OUR build; framework classes (e.g.
    // Capacitor's CAPBridgeViewController) are compiled elsewhere.
    const around = xml.slice(Math.max(0, m.index - 120), m.index + 120);
    if (!around.includes('customModule="App"')) continue;
    if (!compiled.has(cls)) missing.push({ storyboard: sb.replace(process.cwd() + '/', ''), cls });
  }
}

if (missing.length > 0) {
  console.error('\n✖ Storyboard references an App class that is NOT compiled into the app:');
  for (const m of missing) {
    console.error(`    ${m.storyboard} → customClass="${m.cls}" but ${m.cls}.swift is not in`);
    console.error(`      project.pbxproj's Sources build phase → BLACK SCREEN at launch.`);
  }
  console.error(
    `\n  Add the file to the Xcode target (PBXBuildFile + PBXFileReference + the App\n` +
      `  PBXGroup + PBXSourcesBuildPhase), or point the storyboard back at a class that\n` +
      `  is compiled. cap sync does NOT add custom Swift files.\n`,
  );
  process.exit(1);
}

console.log('✓ iOS storyboard custom classes are all compiled into the app.');
