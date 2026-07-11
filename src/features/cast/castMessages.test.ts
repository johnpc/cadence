import { describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/jellyfinStream', () => ({
  imageUrl: (item: { Id: string }) => `https://jf.test/art/${item.Id}`,
}));
import { CAST_NAMESPACE, nowPlayingMessage, queueMessage } from './castMessages';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const track = (Id: string, Name: string, artists: string[] = []): JellyfinItem =>
  ({ Id, Name, Type: 'Audio', Artists: artists }) as JellyfinItem;

describe('castMessages', () => {
  it('exposes a stable custom namespace', () => {
    expect(CAST_NAMESPACE).toBe('urn:x-cast:io.jpc.cadence');
  });

  it('builds a now-playing message with art + artist + play state', () => {
    const msg = nowPlayingMessage(track('t1', 'Song', ['A', 'B']), true);
    expect(msg).toEqual({
      type: 'nowPlaying',
      title: 'Song',
      artist: 'A, B',
      artUrl: 'https://jf.test/art/t1',
      isPlaying: true,
    });
  });

  it('builds a queue message with index + track summaries', () => {
    const msg = queueMessage([track('a', 'A'), track('b', 'B')], 1);
    expect(msg.type).toBe('queue');
    expect(msg.index).toBe(1);
    expect(msg.tracks).toEqual([
      { title: 'A', artist: '' },
      { title: 'B', artist: '' },
    ]);
  });

  it('caps the queue at 50 tracks so the message stays small', () => {
    const many = Array.from({ length: 80 }, (_, i) => track(`t${i}`, `Track ${i}`));
    expect(queueMessage(many, 0).tracks).toHaveLength(50);
  });
});
