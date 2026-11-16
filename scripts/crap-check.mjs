#!/usr/bin/env node
/**
 * CRAP score analysis.
 *
 *   CRAP(f) = complexity(f)^2 * (1 - coverage(f))^3 + complexity(f)
 *
 * Fails the build if ANY function exceeds the threshold. No file gets a pass.
 *
 * Reads Istanbul's coverage-final.json. For each function we derive:
 *   - complexity: cyclomatic complexity, approximated as 1 + (# branch paths
 *     that belong to the function). Istanbul records every branch (if /
 *     ternary / &&/|| / switch), which is exactly the set of decision points
 *     cyclomatic complexity counts.
 *   - coverage: fraction of the function's own statements that were executed.
 *
 * "Belong to" = the INNERMOST function whose span contains it. A nested
 * function (a callback, a command in a factory) is its own entry in Istanbul's
 * fnMap and is scored on its own; counting its branches in every enclosing
 * function as well would score the same decision several times and make any
 * closure-based module (the player engine) look as complex as all its parts
 * combined.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const THRESHOLD = 15;
const COVERAGE_FILE = resolve(process.cwd(), 'coverage/coverage-final.json');

if (!existsSync(COVERAGE_FILE)) {
  console.error(
    `\n✖ CRAP check: ${COVERAGE_FILE} not found.\n` +
      `  Run coverage first:  npm run test:coverage\n`,
  );
  process.exit(1);
}

const coverage = JSON.parse(readFileSync(COVERAGE_FILE, 'utf8'));

/** @param {{start:{line:number,column:number},end:{line:number,column:number}}} outer */
function contains(outer, point) {
  if (!outer || !point) return false;
  const afterStart =
    point.line > outer.start.line ||
    (point.line === outer.start.line && point.column >= outer.start.column);
  const beforeEnd =
    point.line < outer.end.line ||
    (point.line === outer.end.line && point.column <= outer.end.column);
  return afterStart && beforeEnd;
}

const offenders = [];
const allScores = [];

/** Is `a` at or after `b` (line, then column)? */
function atOrAfter(a, b) {
  return a.line > b.line || (a.line === b.line && a.column >= b.column);
}

/** The id of the innermost function whose span contains `point`, or null.
 * Functions nest, so the innermost is the containing one that starts last. */
function innermostFn(spans, point) {
  let best = null;
  for (const [fnId, span] of spans) {
    if (!contains(span, point)) continue;
    if (!best || atOrAfter(span.start, best.span.start)) best = { fnId, span };
  }
  return best?.fnId ?? null;
}

for (const [file, data] of Object.entries(coverage)) {
  const { fnMap = {}, f = {}, statementMap = {}, s = {}, branchMap = {}, b = {} } = data;
  const spans = Object.entries(fnMap)
    .map(([fnId, fnMeta]) => [fnId, fnMeta.loc ?? fnMeta.decl])
    .filter(([, span]) => span);

  // Attribute every branch and statement to its innermost function, once.
  const decisions = new Map();
  for (const [branchId, branchMeta] of Object.entries(branchMap)) {
    const loc = branchMeta.loc ?? branchMeta.locations?.[0];
    const anchor = loc?.start ? loc : { start: loc, end: loc };
    const owner = innermostFn(spans, anchor.start);
    if (owner === null) continue;
    // each additional branch path beyond the first is a decision point
    const paths = Array.isArray(b[branchId]) ? b[branchId].length : 1;
    decisions.set(owner, (decisions.get(owner) ?? 0) + Math.max(1, paths - 1));
  }
  const statements = new Map();
  for (const [stmtId, stmtLoc] of Object.entries(statementMap)) {
    const owner = innermostFn(spans, stmtLoc.start);
    if (owner === null) continue;
    const tally = statements.get(owner) ?? { total: 0, covered: 0 };
    tally.total += 1;
    if ((s[stmtId] ?? 0) > 0) tally.covered += 1;
    statements.set(owner, tally);
  }

  for (const [fnId, span] of spans) {
    const fnMeta = fnMap[fnId];
    const complexity = 1 + (decisions.get(fnId) ?? 0);
    const { total, covered } = statements.get(fnId) ?? { total: 0, covered: 0 };
    const cov = total === 0 ? (f[fnId] > 0 ? 1 : 0) : covered / total;

    const crap = complexity ** 2 * (1 - cov) ** 3 + complexity;
    const record = {
      file: file.replace(`${process.cwd()}/`, ''),
      name: fnMeta.name || '(anonymous)',
      line: span.start.line,
      complexity,
      coverage: cov,
      crap: Math.round(crap * 100) / 100,
    };
    allScores.push(record);
    if (crap > THRESHOLD) offenders.push(record);
  }
}

allScores.sort((a, b) => b.crap - a.crap);

console.log(`\nCRAP score analysis (threshold ${THRESHOLD})`);
console.log('─'.repeat(72));
for (const r of allScores.slice(0, 15)) {
  const cov = `${(r.coverage * 100).toFixed(0)}%`.padStart(4);
  const flag = r.crap > THRESHOLD ? ' ✖' : '';
  console.log(
    `  ${String(r.crap).padStart(7)}  cx=${String(r.complexity).padStart(2)}  cov=${cov}  ` +
      `${r.file}:${r.line} ${r.name}${flag}`,
  );
}
if (allScores.length > 15) console.log(`  … ${allScores.length - 15} more functions`);
console.log('─'.repeat(72));

if (offenders.length > 0) {
  console.error(`\n✖ ${offenders.length} function(s) exceed CRAP ${THRESHOLD}:`);
  for (const r of offenders) {
    console.error(
      `    ${r.file}:${r.line} ${r.name} — CRAP ${r.crap} ` +
        `(complexity ${r.complexity}, coverage ${(r.coverage * 100).toFixed(0)}%)`,
    );
  }
  console.error(`\n  Fix: raise coverage on these functions or reduce their complexity.\n`);
  process.exit(1);
}

console.log(`\n✓ All ${allScores.length} functions are within CRAP ${THRESHOLD}.\n`);
