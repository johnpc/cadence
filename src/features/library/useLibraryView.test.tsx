import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useLibraryView } from './useLibraryView';

describe('useLibraryView', () => {
  afterEach(() => localStorage.clear());

  it('starts on list and toggles to grid and back', () => {
    const { result } = renderHook(() => useLibraryView());
    expect(result.current.view).toBe('list');
    act(() => result.current.toggle());
    expect(result.current.view).toBe('grid');
    act(() => result.current.toggle());
    expect(result.current.view).toBe('list');
  });
});
