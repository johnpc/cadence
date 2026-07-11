import { isIos } from '../../lib/platform';

const REPO = 'https://github.com/johnpc/cadence';

/** A coarse platform label for the report body, so triage knows where it came
 * from without collecting anything identifying. */
function platform(): string {
  if (typeof window === 'undefined') return 'unknown';
  const standalone = window.matchMedia?.('(display-mode: standalone)').matches;
  if (isIos()) return standalone ? 'iOS (installed)' : 'iOS (browser)';
  return standalone ? 'PWA (installed)' : 'Web';
}

/**
 * Build a prefilled GitHub "new issue" URL for a bug or feature report. The
 * body carries the app version + platform (so reports are actionable) followed
 * by a short template. No backend needed — GitHub renders the prefill from the
 * query string. `kind` picks the title prefix + which template to seed.
 */
export function feedbackUrl(kind: 'bug' | 'feature', version: string): string {
  const isBug = kind === 'bug';
  const title = isBug ? '[bug] ' : '[feature] ';
  const context = `\n\n---\nCadence ${version} · ${platform()}`;
  const body = isBug
    ? `**What happened?**\n\n\n**What did you expect?**\n\n\n**Steps to reproduce**\n1. \n2. ${context}`
    : `**What would you like?**\n\n\n**Why? What problem does it solve?**\n${context}`;
  const params = new URLSearchParams({ title, body });
  return `${REPO}/issues/new?${params.toString()}`;
}
