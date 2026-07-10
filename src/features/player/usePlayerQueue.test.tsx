import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { usePlayerQueue } from './usePlayerQueue';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const tracks: JellyfinItem[] = ['a', 'b', 'c'].map((id) => ({ Id: id, Name: id, Type: 'Audio' }));

describe('usePlayerQueue', () => {
  afterEach(() => localStorage.clear());

  it('cycles repeat off → all → one → off', () => {
    const { result } = renderHook(() => usePlayerQueue());
    expect(result.current.repeat).toBe('off');
    act(() => result.current.cycleRepeat());
    expect(result.current.repeat).toBe('all');
    act(() => result.current.cycleRepeat());
    expect(result.current.repeat).toBe('one');
    act(() => result.current.cycleRepeat());
    expect(result.current.repeat).toBe('off');
  });

  it('restores persisted shuffle + repeat on a fresh mount', () => {
    const first = renderHook(() => usePlayerQueue());
    act(() => first.result.current.cycleRepeat()); // -> 'all'
    act(() => first.result.current.toggleShuffle()); // -> true
    first.unmount();
    const { result } = renderHook(() => usePlayerQueue());
    expect(result.current.repeat).toBe('all');
    expect(result.current.shuffle).toBe(true);
  });

  it('advance goes to the next track by default', () => {
    const { result } = renderHook(() => usePlayerQueue());
    act(() => result.current.playQueue(tracks, 0));
    act(() => result.current.advance(vi.fn()));
    expect(result.current.queue.index).toBe(1);
  });

  it('advance replays the same track on repeat=one', () => {
    const { result } = renderHook(() => usePlayerQueue());
    act(() => result.current.playQueue(tracks, 0));
    act(() => result.current.cycleRepeat()); // all
    act(() => result.current.cycleRepeat()); // one
    const replay = vi.fn();
    act(() => result.current.advance(replay));
    expect(result.current.queue.index).toBe(0);
    expect(replay).toHaveBeenCalled();
  });

  it('advance loops to the start at the end on repeat=all', () => {
    const { result } = renderHook(() => usePlayerQueue());
    act(() => result.current.playQueue(tracks, 2)); // last track
    act(() => result.current.cycleRepeat()); // all
    act(() => result.current.advance(vi.fn()));
    expect(result.current.queue.index).toBe(0);
  });

  it('advance stops at the end when repeat is off', () => {
    const { result } = renderHook(() => usePlayerQueue());
    act(() => result.current.playQueue(tracks, 2));
    act(() => result.current.advance(vi.fn()));
    expect(result.current.queue.index).toBe(2);
  });

  it('manual next wraps last→first only when repeat-all', () => {
    const { result } = renderHook(() => usePlayerQueue());
    act(() => result.current.playQueue(tracks, 2)); // last
    act(() => result.current.next()); // repeat off → stays
    expect(result.current.queue.index).toBe(2);
    act(() => result.current.cycleRepeat()); // all
    act(() => result.current.next()); // now wraps to first
    expect(result.current.queue.index).toBe(0);
  });

  it('manual prev wraps first→last only when repeat-all', () => {
    const { result } = renderHook(() => usePlayerQueue());
    act(() => result.current.playQueue(tracks, 0)); // first
    act(() => result.current.prev()); // repeat off → stays
    expect(result.current.queue.index).toBe(0);
    act(() => result.current.cycleRepeat()); // all
    act(() => result.current.prev()); // now wraps to last
    expect(result.current.queue.index).toBe(2);
  });

  it('jumpTo moves to a given index', () => {
    const { result } = renderHook(() => usePlayerQueue());
    act(() => result.current.playQueue(tracks, 0));
    act(() => result.current.jumpTo(2));
    expect(result.current.queue.index).toBe(2);
  });

  it('playNext inserts after the current track', () => {
    const { result } = renderHook(() => usePlayerQueue());
    act(() => result.current.playQueue(tracks, 0));
    act(() => result.current.playNext({ Id: 'x', Name: 'x', Type: 'Audio' }));
    expect(result.current.queue.tracks.map((t) => t.Id)).toEqual(['a', 'x', 'b', 'c']);
  });

  it('playShuffled loads a shuffled queue and turns shuffle on', () => {
    const { result } = renderHook(() => usePlayerQueue());
    act(() => result.current.playShuffled(tracks));
    expect(result.current.shuffle).toBe(true);
    expect(result.current.queue.index).toBe(0);
    expect(result.current.queue.tracks.map((t) => t.Id).sort()).toEqual(['a', 'b', 'c']);
  });

  it('toggling shuffle OFF restores the pre-shuffle order (Spotify-style)', () => {
    const { result } = renderHook(() => usePlayerQueue());
    act(() => result.current.playQueue(tracks, 0)); // a,b,c
    act(() => result.current.toggleShuffle()); // ON — shuffles the upcoming
    expect(result.current.shuffle).toBe(true);
    act(() => result.current.toggleShuffle()); // OFF — must restore a,b,c
    expect(result.current.shuffle).toBe(false);
    expect(result.current.queue.tracks.map((t) => t.Id)).toEqual(['a', 'b', 'c']);
  });

  it('removeFromQueue drops the track at an index', () => {
    const { result } = renderHook(() => usePlayerQueue());
    act(() => result.current.playQueue(tracks, 0));
    act(() => result.current.removeFromQueue(1));
    expect(result.current.queue.tracks.map((t) => t.Id)).toEqual(['a', 'c']);
  });

  it('addToQueue appends to the end and seeds an empty queue', () => {
    const { result } = renderHook(() => usePlayerQueue());
    act(() => result.current.addToQueue(tracks[0]));
    expect(result.current.queue.tracks.map((t) => t.Id)).toEqual(['a']);
    act(() => result.current.playQueue(tracks, 0));
    act(() => result.current.addToQueue({ Id: 'z', Name: 'z', Type: 'Audio' }));
    expect(result.current.queue.tracks.map((t) => t.Id)).toEqual(['a', 'b', 'c', 'z']);
    expect(result.current.queue.index).toBe(0);
  });

  it('addToQueue appends a whole array and ignores an empty one', () => {
    const { result } = renderHook(() => usePlayerQueue());
    act(() => result.current.addToQueue([tracks[0], tracks[1]]));
    expect(result.current.queue.tracks.map((t) => t.Id)).toEqual(['a', 'b']);
    act(() => result.current.addToQueue([]));
    expect(result.current.queue.tracks.map((t) => t.Id)).toEqual(['a', 'b']);
  });

  it('clearQueue drops everything after the current track', () => {
    const { result } = renderHook(() => usePlayerQueue());
    act(() => result.current.playQueue(tracks, 0));
    act(() => result.current.clearQueue());
    expect(result.current.queue.tracks.map((t) => t.Id)).toEqual(['a']);
  });

  it('moveInQueue reorders a track', () => {
    const { result } = renderHook(() => usePlayerQueue());
    act(() => result.current.playQueue(tracks, 0));
    act(() => result.current.moveInQueue(2, 0));
    expect(result.current.queue.tracks.map((t) => t.Id)).toEqual(['c', 'a', 'b']);
  });
});
