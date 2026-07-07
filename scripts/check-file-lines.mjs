#!/usr/bin/env node
/**
 * File-length discipline: every source file (.ts and .tsx) must stay short
 * and single-purpose. Anything over MAX_LINES is a signal to extract logic
 * into a smaller, tested helper or split the file. Fails the build if any
 * source file is too long. Test files are exempt.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const MAX_LINES = 100;
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
    `\n  This limit reduces complexity, not line count. Don't game it by deleting\n` +
      `  comments or blank lines — extract a function to genuinely simplify the file.\n`,
  );
  process.exit(1);
}

console.log(`✓ All source files are within ${MAX_LINES} lines.`);
