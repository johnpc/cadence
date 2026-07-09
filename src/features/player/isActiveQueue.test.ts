import { describe, expect, it } from 'vitest';
import { isActiveQueue } from './isActiveQueue';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const t = (id: string): JellyfinItem => ({ Id: id, Name: id, Type: 'Audio' });

describe('isActiveQueue', () => {
  it('is true when the queue holds exactly these ids in order', () => {
    expect(isActiveQueue([t('a'), t('b')], [t('a'), t('b')])).toBe(true);
  });

  it('is false when order differs', () => {
    expect(isActiveQueue([t('a'), t('b')], [t('b'), t('a')])).toBe(false);
  });

  it('is false when lengths differ', () => {
    expect(isActiveQueue([t('a')], [t('a'), t('b')])).toBe(false);
  });

  it('is false for an empty collection (nothing to be active)', () => {
    expect(isActiveQueue([], [])).toBe(false);
  });

  it('is false when the queue is a superset', () => {
    expect(isActiveQueue([t('a'), t('b')], [t('a'), t('b'), t('c')])).toBe(false);
  });
});
