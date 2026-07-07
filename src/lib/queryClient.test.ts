import { describe, expect, it } from 'vitest';
import { queryClient } from './queryClient';

describe('queryClient', () => {
  it('retries once and does not refetch on window focus', () => {
    const defaults = queryClient.getDefaultOptions().queries;
    expect(defaults?.retry).toBe(1);
    expect(defaults?.refetchOnWindowFocus).toBe(false);
  });
});
