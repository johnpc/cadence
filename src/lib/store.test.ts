import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createStore, useStore } from './store';

describe('createStore', () => {
  afterEach(() => localStorage.clear());

  it('holds a value, notifies subscribers, and skips identical sets', () => {
    const s = createStore(1);
    const spy = vi.fn();
    const off = s.subscribe(spy);
    s.set(2);
    s.set(2);
    s.update((n) => n + 1);
    expect(s.get()).toBe(3);
    expect(spy).toHaveBeenCalledTimes(2);
    off();
    s.set(4);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('persists through localStorage and rehydrates', () => {
    const a = createStore({ on: false }, { persistKey: 'k' });
    a.set({ on: true });
    expect(JSON.parse(localStorage.getItem('k') ?? '')).toEqual({ on: true });
    const b = createStore({ on: false }, { persistKey: 'k' });
    expect(b.get()).toEqual({ on: true });
  });

  it('falls back on junk and lets parse repair values', () => {
    localStorage.setItem('k', 'not json');
    expect(createStore(5, { persistKey: 'k' }).get()).toBe(5);
    localStorage.setItem('k', '"loud"');
    const parsed = createStore<'quiet' | 'loud'>('quiet', {
      persistKey: 'k',
      parse: (raw) => (raw === 'loud' ? 'loud' : 'quiet'),
    });
    expect(parsed.get()).toBe('loud');
  });

  it('survives a storage write failure and still emits', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('full');
    });
    const onChange = vi.fn();
    const s = createStore<number>(0, { persistKey: 'k', onChange });
    s.set(1);
    expect(s.get()).toBe(1);
    expect(onChange).toHaveBeenCalledWith(1);
    setItem.mockRestore();
  });
});

describe('useStore', () => {
  it('re-renders on change and supports a selector', () => {
    const s = createStore({ a: 1, b: 'x' });
    const whole = renderHook(() => useStore(s));
    const slice = renderHook(() => useStore(s, (v) => v.b));
    act(() => s.set({ a: 2, b: 'x' }));
    expect(whole.result.current.a).toBe(2);
    expect(slice.result.current).toBe('x');
    act(() => s.set({ a: 2, b: 'y' }));
    expect(slice.result.current).toBe('y');
  });
});
