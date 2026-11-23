#!/usr/bin/env node
/**
 * Design-token discipline: every `var(--cad-*)` the app reads must be DEFINED
 * somewhere in src/**.css. An undefined custom property is silently invalid, so
 * a typo or a token that was never added (`--cad-space-5`, `--cad-radius`) just
 * drops the declaration — square corners, collapsed spacing, a transparent bar —
 * with no error anywhere. This fails the build instead (2026-11-22 audit found
 * five such tokens across 23 call sites).
 *
 * Reads .css/.ts/.tsx under src/ (TS uses tokens in inline styles), ignores test
 * files, and treats a `var(--cad-x, fallback)` the same as `var(--cad-x)`: the
 * fallback hides the miss, it doesn't excuse it.
 *
 * It also holds the type scale: a raw `font-size: Npx` (CSS) or a literal
 * `fontSize: N` (inline style) outside src/theme/variables.css fails — sizes
 * come from --cad-text-* / --cad-icon-* or the role classes, so the same role
 * can't drift by a pixel between screens (the audit counted 128 raw sizes in 21
 * values).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = join(process.cwd(), 'src');
const SOURCE = /\.(css|tsx?)$/;
const TEST = /\.test\.tsx?$/;

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (SOURCE.test(entry) && !TEST.test(entry)) out.push(full);
  }
  return out;
}

const files = walk(ROOT);
const defined = new Set();
const uses = new Map(); // token -> [file:line]
const rawSizes = []; // file:line of a px font size outside the scale
const RAW_CSS_SIZE = /font-size:\s*[0-9.]+px/;
const RAW_INLINE_SIZE = /fontSize:\s*[0-9]/;
const THEME = join('src', 'theme', 'variables.css');

for (const file of files) {
  const text = readFileSync(file, 'utf8');
  const lines = text.split('\n');
  lines.forEach((line, i) => {
    const raw = file.endsWith('.css') ? RAW_CSS_SIZE : RAW_INLINE_SIZE;
    if (!file.endsWith(THEME) && raw.test(line)) {
      rawSizes.push(`${relative(process.cwd(), file)}:${i + 1}`);
    }
    if (file.endsWith('.css')) {
      for (const m of line.matchAll(/(--cad-[a-z0-9-]+)\s*:/g)) defined.add(m[1]);
    }
    for (const m of line.matchAll(/var\(\s*(--cad-[a-z0-9-]+)/g)) {
      const at = `${relative(process.cwd(), file)}:${i + 1}`;
      if (!uses.has(m[1])) uses.set(m[1], []);
      uses.get(m[1]).push(at);
    }
  });
}

const missing = [...uses.keys()].filter((t) => !defined.has(t)).sort();
if (rawSizes.length) {
  console.error('✗ Raw font sizes (use a --cad-text-* / --cad-icon-* step or a role class):');
  for (const at of rawSizes) console.error(`  ${at}`);
}
if (missing.length) {
  console.error(
    '✗ Undefined design tokens (add them to src/theme/variables.css or use an existing one):',
  );
  for (const t of missing) console.error(`  ${t}  ← ${uses.get(t).join(', ')}`);
}
if (missing.length || rawSizes.length) process.exit(1);
console.log(`✓ All ${uses.size} --cad-* tokens in use are defined; no raw font sizes.`);
