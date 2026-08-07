import { describe, expect, it } from 'vitest';
import { aboutPreview, isAboutTruncatable } from './aboutPreview';

describe('aboutPreview', () => {
  it('returns short text unchanged', () => {
    expect(aboutPreview('Short blurb', 280)).toBe('Short blurb');
    expect(isAboutTruncatable('Short blurb', 280)).toBe(false);
  });

  it('trims long text at a word boundary with an ellipsis', () => {
    const text = 'one two three four five six seven';
    const out = aboutPreview(text, 12);
    expect(out).toBe('one two…'); // cut at last space within 12 chars ("one two thre")
    expect(out.endsWith('…')).toBe(true);
    expect(isAboutTruncatable(text, 12)).toBe(true);
  });

  it('falls back to a hard slice when there is no space in range', () => {
    expect(aboutPreview('supercalifragilistic', 5)).toBe('super…');
  });
});
