import { afterEach, describe, expect, it, vi } from 'vitest';
import { contextFor, getPlayContext, setPlayContext, subscribePlayContext } from './playContext';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const t = (id: string): JellyfinItem => ({ Id: id, Name: id, Type: 'Audio' });

afterEach(() => setPlayContext(null));

describe('playContext', () => {
  it('stores a collection context and fingerprints its track ids', () => {
    setPlayContext({ kind: 'playlist', label: 'Chill', tracks: [t('a'), t('b')] });
    const ctx = getPlayContext();
    expect(ctx?.kind).toBe('playlist');
    expect(ctx?.label).toBe('Chill');
    expect([...(ctx?.trackIds ?? [])]).toEqual(['a', 'b']);
  });

  it('contextFor returns the context only for a track in the collection', () => {
    setPlayContext({ kind: 'album', label: 'Rent', tracks: [t('a'), t('b')] });
    expect(contextFor('a')?.label).toBe('Rent');
    // A track outside the collection (e.g. endless radio drifted off) → no label.
    expect(contextFor('z')).toBeNull();
    expect(contextFor(undefined)).toBeNull();
  });

  it('clears the context when set to null', () => {
    setPlayContext({ kind: 'genre', label: 'Rock', tracks: [t('a')] });
    setPlayContext(null);
    expect(getPlayContext()).toBeNull();
    expect(contextFor('a')).toBeNull();
  });

  it('notifies subscribers on change and stops after unsubscribe', () => {
    const spy = vi.fn();
    const unsub = subscribePlayContext(spy);
    setPlayContext({ kind: 'playlist', label: 'X', tracks: [t('a')] });
    expect(spy).toHaveBeenCalledTimes(1);
    unsub();
    setPlayContext(null);
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
