import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createStore, createStoredValue, useStore, watch } from './store';

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

describe('watch', () => {
  it('fires only when the selected slice changes, with prev', () => {
    const s = createStore({ a: 1, b: 1 });
    const seen: Array<[number, number | undefined]> = [];
    const off = watch(
      s,
      (v) => v.a,
      (next, prev) => seen.push([next, prev]),
    );
    s.set({ a: 1, b: 2 });
    s.set({ a: 2, b: 2 });
    off();
    s.set({ a: 3, b: 2 });
    expect(seen).toEqual([[2, 1]]);
  });

  it('can fire immediately and use a custom equality', () => {
    const s = createStore({ list: [1] });
    const fn = vi.fn();
    watch(s, (v) => v.list, fn, { immediate: true, equals: (a, b) => a.length === b.length });
    s.set({ list: [9] });
    s.set({ list: [9, 9] });
    expect(fn.mock.calls.map((c) => c[0])).toEqual([[1], [9, 9]]);
    expect(fn.mock.calls[0][1]).toBeUndefined();
  });
});

describe('createStoredValue', () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });
  const flag = () =>
    createStoredValue({
      key: 'cadence.flag',
      parse: (raw) => raw === 'on',
      serialize: (on) => (on ? 'on' : 'off'),
    });

  it('keeps the existing string format and reads through storage', () => {
    const s = flag();
    expect(s.get()).toBe(false);
    const spy = vi.fn();
    s.subscribe(spy);
    s.set(true);
    expect(localStorage.getItem('cadence.flag')).toBe('on');
    localStorage.setItem('cadence.flag', 'off');
    expect(s.get()).toBe(false);
    s.update((v) => !v);
    expect(s.get()).toBe(true);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('falls back to the default when storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('full');
    });
    const s = flag();
    const spy = vi.fn();
    s.subscribe(spy);
    s.set(true);
    expect(s.get()).toBe(false);
    expect(spy).toHaveBeenCalled();
  });
});
