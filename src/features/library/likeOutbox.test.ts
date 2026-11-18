import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError, RequestTimeout, Unauthenticated } from '../../lib/jellyfinErrors';
import { setSession } from '../../lib/sessionStore';
import {
  clearLike,
  flushLikes,
  isUnreachable,
  likeOutboxStore,
  pendingLike,
  queueLike,
} from './likeOutbox';

describe('likeOutbox', () => {
  beforeEach(() => setSession({ token: 't', userId: 'u1' }));
  afterEach(() => {
    likeOutboxStore.set({});
    setSession(null);
  });

  it('keeps the latest wish per item, on disk', () => {
    queueLike('a', true);
    queueLike('a', false);
    expect(pendingLike('a')).toBe(false);
    expect(JSON.parse(localStorage.getItem('cadence.like-outbox') ?? '{}')).toEqual({
      u1: { a: false },
    });
  });

  it('is per user: another account never sees or sends it', () => {
    queueLike('a', true);
    setSession({ token: 't', userId: 'u2' });
    expect(pendingLike('a')).toBeUndefined();
  });

  it('does nothing without a signed-in user', () => {
    setSession(null);
    queueLike('a', true);
    expect(likeOutboxStore.get()).toEqual({});
  });

  it('clearing the last wish removes the user entirely; clearing nothing is a no-op', () => {
    queueLike('a', true);
    clearLike('missing');
    clearLike('a');
    expect(likeOutboxStore.get()).toEqual({});
  });

  it('reads back a corrupt or foreign stored value as empty', () => {
    likeOutboxStore.set([] as unknown as Record<string, Record<string, boolean>>);
    expect(pendingLike('a', [] as never)).toBeUndefined();
  });

  it('tells "couldn’t reach the server" apart from "the server said no"', () => {
    expect(isUnreachable(new TypeError('Failed to fetch'))).toBe(true);
    expect(isUnreachable(new RequestTimeout())).toBe(true);
    expect(isUnreachable(new HttpError(404))).toBe(false);
    expect(isUnreachable(new Unauthenticated())).toBe(false);
  });

  describe('flushLikes', () => {
    it('sends every wish and clears what the server accepted', async () => {
      queueLike('a', true);
      queueLike('b', false);
      const send = vi.fn(() => Promise.resolve());
      expect(await flushLikes(send)).toBe(2);
      expect(send).toHaveBeenCalledWith('a', true);
      expect(send).toHaveBeenCalledWith('b', false);
      expect(likeOutboxStore.get()).toEqual({});
    });

    it('stops at the first unreachable error and keeps the rest', async () => {
      queueLike('a', true);
      queueLike('b', true);
      const send = vi.fn(() => Promise.reject(new TypeError('Failed to fetch')));
      expect(await flushLikes(send)).toBe(0);
      expect(send).toHaveBeenCalledTimes(1);
      expect(pendingLike('a')).toBe(true);
      expect(pendingLike('b')).toBe(true);
    });

    it('drops a wish the server rejects (never retried forever)', async () => {
      queueLike('gone', true);
      queueLike('ok', true);
      const send = vi.fn((id: string) =>
        id === 'gone' ? Promise.reject(new HttpError(404)) : Promise.resolve(),
      );
      expect(await flushLikes(send)).toBe(1);
      expect(likeOutboxStore.get()).toEqual({});
    });

    it('sends nothing for a user with no wishes', async () => {
      const send = vi.fn(() => Promise.resolve());
      expect(await flushLikes(send)).toBe(0);
      expect(send).not.toHaveBeenCalled();
    });
  });
});
