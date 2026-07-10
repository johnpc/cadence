import { afterEach, describe, expect, it } from 'vitest';
import { loadQueue, saveQueue } from './queuePersistence';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const t = (id: string): JellyfinItem => ({ Id: id, Name: id, Type: 'Audio' });

describe('queuePersistence', () => {
  afterEach(() => localStorage.clear());

  it('round-trips a queue', () => {
    saveQueue({ tracks: [t('a'), t('b'), t('c')], index: 1 });
    const loaded = loadQueue();
    expect(loaded.tracks.map((x) => x.Id)).toEqual(['a', 'b', 'c']);
    expect(loaded.index).toBe(1);
  });

  it('round-trips the pre-shuffle order so shuffle-off survives a reload', () => {
    saveQueue({ tracks: [t('c'), t('a'), t('b')], index: 0, unshuffled: [t('a'), t('b'), t('c')] });
    const loaded = loadQueue();
    expect(loaded.tracks.map((x) => x.Id)).toEqual(['c', 'a', 'b']);
    expect(loaded.unshuffled?.map((x) => x.Id)).toEqual(['a', 'b', 'c']);
  });

  it('omits unshuffled when the queue was not shuffled', () => {
    saveQueue({ tracks: [t('a'), t('b')], index: 0 });
    expect(loadQueue().unshuffled).toBeUndefined();
  });

  it('returns the empty queue when nothing is stored', () => {
    expect(loadQueue()).toEqual({ tracks: [], index: 0 });
  });

  it('clears storage when saving an empty queue', () => {
    saveQueue({ tracks: [t('a')], index: 0 });
    saveQueue({ tracks: [], index: 0 });
    expect(loadQueue().tracks).toHaveLength(0);
  });

  it('clamps a bad index and drops malformed tracks', () => {
    localStorage.setItem(
      'cadence.queue',
      JSON.stringify({ tracks: [t('a'), { Id: '' }, t('b')], index: 99 }),
    );
    const loaded = loadQueue();
    expect(loaded.tracks.map((x) => x.Id)).toEqual(['a', 'b']);
    expect(loaded.index).toBe(1);
  });

  it('tolerates corrupt storage', () => {
    localStorage.setItem('cadence.queue', '{not json');
    expect(loadQueue()).toEqual({ tracks: [], index: 0 });
  });
});
