import { describe, expect, it } from 'vitest';
import { qualityBadge, formatDuration } from './qualityBadge';
import type { GrabResult } from './grabTypes';

const r = (score: number): GrabResult => ({ quality_score: score }) as GrabResult;

describe('qualityBadge', () => {
  it('marks high scores lossless', () => {
    expect(qualityBadge(r(150))).toEqual({ label: 'Lossless', lossless: true });
    expect(qualityBadge(r(120))).toEqual({ label: 'Lossless', lossless: true });
  });
  it('buckets mid scores as High', () => {
    expect(qualityBadge(r(90))).toEqual({ label: 'High', lossless: false });
  });
  it('buckets low scores as Standard', () => {
    expect(qualityBadge(r(10))).toEqual({ label: 'Standard', lossless: false });
    expect(qualityBadge({} as GrabResult)).toEqual({ label: 'Standard', lossless: false });
  });
});

describe('formatDuration', () => {
  it('formats mm:ss', () => {
    expect(formatDuration(225)).toBe('3:45');
    expect(formatDuration(5)).toBe('0:05');
  });
  it('is empty for unknown', () => {
    expect(formatDuration(null)).toBe('');
    expect(formatDuration(0)).toBe('');
  });
});
