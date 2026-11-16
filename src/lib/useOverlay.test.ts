import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useOverlay } from './useOverlay';

describe('useOverlay', () => {
  it('starts with nothing open and opens one overlay at a time', () => {
    const { result } = renderHook(() => useOverlay<'menu' | 'pick'>());
    expect(result.current.open).toBeNull();
    act(() => result.current.show('menu'));
    expect(result.current.open).toBe('menu');
    act(() => result.current.show('pick'));
    expect(result.current.open).toBe('pick');
  });

  it("ignores a stale dismiss from the overlay that handed off (Ionic's order)", () => {
    const { result } = renderHook(() => useOverlay<'menu' | 'pick'>());
    act(() => result.current.show('menu'));
    act(() => result.current.show('pick')); // a menu button opened the picker…
    act(() => result.current.closed('menu')); // …then the menu's onDidDismiss fired
    expect(result.current.open).toBe('pick');
  });

  it('closes when the open overlay is dismissed', () => {
    const { result } = renderHook(() => useOverlay<'menu' | 'pick'>());
    act(() => result.current.show('pick'));
    act(() => result.current.closed('pick'));
    expect(result.current.open).toBeNull();
  });
});
