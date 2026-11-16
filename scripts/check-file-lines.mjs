#!/usr/bin/env node
/**
 * File-length TRIPWIRE (not a design gate). Seams should follow concepts, not
 * line counts: the old 100-line cap pushed the player into 20+ hooks threading
 * refs into each other just to fit. Complexity is now gated where it belongs —
 * per function (ESLint `complexity` + CRAP). This script only catches the
 * pathological case: a file so long that no reader (human or agent) can hold
 * it in view. Test files are exempt.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const MAX_LINES = 300;
// The one source tree we author. Cadence has no self-hosted backend of its own —
// Jellyfin IS the backend — so there's no `amplify/` tree to walk.
const ROOTS = ['src'].map((d) => join(process.cwd(), d));
const SKIP_DIRS = new Set(['node_modules', 'dist', 'build']);

/** @returns {string[]} */
function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...walk(full));
    } else if (
      (entry.endsWith('.ts') || entry.endsWith('.tsx')) &&
      !entry.endsWith('.test.ts') &&
      !entry.endsWith('.test.tsx') &&
      !entry.endsWith('.d.ts')
    ) {
      out.push(full);
    }
  }
  return out;
}

const offenders = [];
for (const root of ROOTS) {
  if (!existsSync(root)) continue;
  for (const file of walk(root)) {
    const lines = readFileSync(file, 'utf8').split('\n').length;
    if (lines > MAX_LINES) offenders.push({ file: relative(process.cwd(), file), lines });
  }
}

if (offenders.length > 0) {
  console.error(`\n✖ Source files exceeding ${MAX_LINES} lines:`);
  for (const o of offenders) console.error(`    ${o.file} — ${o.lines} lines`);
  console.error(
    `\n  A file this long holds more than one concept. Split it along a seam that\n` +
      `  means something (a module with its own tests), not at an arbitrary line.\n`,
  );
  process.exit(1);
}

console.log(`✓ All source files are within ${MAX_LINES} lines.`);
