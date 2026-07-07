import { describe, it, expect } from 'vitest';
import { resolveEffectiveTheme } from './resolveTheme';

describe('resolveEffectiveTheme', () => {
  it('passes through an explicit light/dark preference', () => {
    expect(resolveEffectiveTheme('light', true)).toBe('light');
    expect(resolveEffectiveTheme('dark', false)).toBe('dark');
  });

  it('resolves system to the OS preference', () => {
    expect(resolveEffectiveTheme('system', true)).toBe('dark');
    expect(resolveEffectiveTheme('system', false)).toBe('light');
  });
});
