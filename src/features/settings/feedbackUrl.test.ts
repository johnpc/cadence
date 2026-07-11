import { afterEach, describe, expect, it, vi } from 'vitest';
import { feedbackUrl } from './feedbackUrl';

const { isIos } = vi.hoisted(() => ({ isIos: vi.fn(() => false) }));
vi.mock('../../lib/platform', () => ({ isIos }));

/** Parse the title/body back out of a feedback URL (decodes +→space too). */
function parts(url: string) {
  const params = new URL(url).searchParams;
  return { title: params.get('title') ?? '', body: params.get('body') ?? '' };
}

describe('feedbackUrl', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    isIos.mockReturnValue(false);
  });

  it('points at the repo new-issue page', () => {
    expect(feedbackUrl('bug', '1.2.3')).toContain('github.com/johnpc/cadence/issues/new');
  });

  it('prefixes the title by kind', () => {
    expect(parts(feedbackUrl('bug', '1.2.3')).title).toBe('[bug] ');
    expect(parts(feedbackUrl('feature', '1.2.3')).title).toBe('[feature] ');
  });

  it('includes the app version + platform in the body', () => {
    const { body } = parts(feedbackUrl('bug', '9.9.9'));
    expect(body).toContain('Cadence 9.9.9');
    expect(body).toContain('Web');
  });

  it('uses a bug template for bugs and a feature template for features', () => {
    expect(parts(feedbackUrl('bug', '1')).body).toContain('Steps to reproduce');
    expect(parts(feedbackUrl('feature', '1')).body).toContain('What problem does it solve');
  });

  it('reports an installed PWA when in standalone display mode', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    expect(parts(feedbackUrl('bug', '1')).body).toContain('PWA (installed)');
  });

  it('labels iOS (browser vs installed)', () => {
    isIos.mockReturnValue(true);
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    expect(parts(feedbackUrl('bug', '1')).body).toContain('iOS (browser)');
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    expect(parts(feedbackUrl('bug', '1')).body).toContain('iOS (installed)');
  });
});
