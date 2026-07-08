import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { usePlayer } from './usePlayer';

describe('usePlayer', () => {
  it('throws when used outside a PlayerProvider', () => {
    expect(() => renderHook(() => usePlayer())).toThrow(/within a PlayerProvider/);
  });
});
