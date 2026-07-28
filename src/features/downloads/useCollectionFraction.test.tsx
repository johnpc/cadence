import { renderHook, act } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useCollectionFraction } from './useCollectionFraction';
import { setProgress, __resetProgress } from './downloadProgress';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const track = (Id: string): JellyfinItem => ({ Id, Name: Id }) as JellyfinItem;
const tracks = [track('a'), track('b'), track('c'), track('d')];

afterEach(() => __resetProgress());

describe('useCollectionFraction', () => {
  it('is 0 for an empty collection', () => {
    const { result } = renderHook(() => useCollectionFraction([], 0));
    expect(result.current).toBe(0);
  });

  it('counts already-saved tracks as full', () => {
    const { result } = renderHook(() => useCollectionFraction(tracks, 2));
    expect(result.current).toBe(0.5); // 2 of 4
  });

  it('adds in-flight partial fractions on top of saved', () => {
    const { result } = renderHook(() => useCollectionFraction(tracks, 1));
    act(() => setProgress('b', 0.5));
    // (1 saved + 0.5 in-flight) / 4 = 0.375
    expect(result.current).toBe(0.375);
  });

  it('never exceeds 1', () => {
    const { result } = renderHook(() => useCollectionFraction(tracks, 4));
    act(() => setProgress('a', 1));
    expect(result.current).toBe(1);
  });
});
