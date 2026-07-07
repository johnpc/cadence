#!/usr/bin/env node
/**
 * Feature-coverage discipline: every e2e/features/**.feature that runs in CI
 * MUST be matched by a path in the CI `acceptance` job's matrix. The matrix
 * enumerates feature directories explicitly, so a new .feature in an unlisted
 * dir compiles to a spec that NO job runs — it never executes yet the suite
 * stays green. This fails the build when such a feature is unmapped.
 *
 * Exempt: features whose EVERY scenario is @requires-deploy. playwright.config
 * filters `not @requires-deploy` in CI, so a fully-gated feature contributes
 * zero CI specs by design (it runs only with RUN_PENDING_DEPLOY=1). Those are
 * intentional, not silent — we LOG them so the exclusion stays visible.
 *
 * No YAML dependency: we read the `paths:` values out of ci.yml as text and
 * translate the generated-spec paths back to source .feature paths.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const FEATURES_DIR = join(process.cwd(), 'e2e', 'features');
const CI_FILE = join(process.cwd(), '.github', 'workflows', 'ci.yml');
const DEPLOY_TAG = '@requires-deploy';
// playwright-bdd compiles e2e/features/X.feature → .features-gen/e2e/features/X.feature.spec.js.
// The generated path already embeds the e2e/features/ source path, so mapping
// back to source is just stripping this prefix.
const GEN_PREFIX = '.features-gen/';

/** @returns {string[]} every .feature path, repo-relative with / separators */
function walkFeatures(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walkFeatures(full));
    else if (entry.endsWith('.feature'))
      out.push(relative(process.cwd(), full).split('\\').join('/'));
  }
  return out;
}

/** Translate one matrix path token to the source-tree prefix it covers. */
function toSourcePrefix(token) {
  let p = token.startsWith(GEN_PREFIX) ? token.slice(GEN_PREFIX.length) : token;
  if (p.endsWith('.feature.spec.js')) p = p.slice(0, -'.spec.js'.length); // single-file token
  return p;
}

/** @returns {string[]} all source prefixes the acceptance matrix covers */
function coveredPrefixes() {
  const prefixes = [];
  for (const line of readFileSync(CI_FILE, 'utf8').split('\n')) {
    const m = line.match(/^\s*paths:\s*(.+)$/);
    if (m) for (const token of m[1].trim().split(/\s+/)) prefixes.push(toSourcePrefix(token));
  }
  return prefixes;
}

/**
 * True when every scenario in the feature is @requires-deploy — so it yields no
 * CI spec by design. A feature-level tag (a tag line before `Feature:`) gates
 * all scenarios; otherwise each Scenario/Scenario Outline must carry it itself.
 */
function isFullyDeployGated(featPath) {
  const lines = readFileSync(join(process.cwd(), featPath), 'utf8').split('\n');
  const featureAt = lines.findIndex((l) => /^\s*Feature:/.test(l));
  const featureTagged = lines
    .slice(0, featureAt < 0 ? 0 : featureAt)
    .some((l) => l.includes(DEPLOY_TAG));
  if (featureTagged) return true;

  let pendingTags = '';
  let sawScenario = false;
  for (const line of lines.slice(featureAt + 1)) {
    if (/^\s*@/.test(line)) pendingTags += ` ${line}`;
    else if (/^\s*Scenario(\s|:|\sOutline)/.test(line)) {
      sawScenario = true;
      if (!pendingTags.includes(DEPLOY_TAG)) return false; // a CI-runnable scenario
      pendingTags = '';
    } else if (line.trim()) pendingTags = ''; // non-tag, non-scenario clears pending tags
  }
  return sawScenario;
}

const prefixes = coveredPrefixes();
if (prefixes.length === 0) {
  console.error('\n✖ Found no matrix `paths:` in ci.yml — cannot verify feature coverage.\n');
  process.exit(1);
}

const isCovered = (feat) =>
  prefixes.some((p) => feat === p || feat.startsWith(p.endsWith('/') ? p : `${p}/`));

const features = walkFeatures(FEATURES_DIR);
const unmapped = features.filter((f) => !isCovered(f) && !isFullyDeployGated(f));
const gated = features.filter((f) => !isCovered(f) && isFullyDeployGated(f));

if (unmapped.length > 0) {
  console.error('\n✖ .feature files not mapped to any CI acceptance matrix area:');
  for (const f of unmapped) console.error(`    ${f}`);
  console.error(
    '\n  These compile to specs that NO CI job runs — they would never execute.\n' +
      `  Add each to a matrix area \`paths:\` in .github/workflows/ci.yml,\n` +
      `  or tag every scenario ${DEPLOY_TAG} if it is intentionally deploy-only.\n`,
  );
  process.exit(1);
}

for (const f of gated)
  console.log(`• ${f} — exempt (all scenarios ${DEPLOY_TAG}; runs only on deploy)`);
console.log(
  `✓ All ${features.length} .feature files run in a CI acceptance area (or are deploy-gated).`,
);
