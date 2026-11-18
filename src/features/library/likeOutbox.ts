/**
 * Likes the server hasn't heard about yet. A like (or unlike) made while the
 * server can't be reached is kept here — on disk, per user, so it survives an
 * app restart — and sent when the connection comes back. Only the latest wish
 * per item is kept (like → unlike offline sends just "unlike"). The heart reads
 * the pending wish first, so it shows what the user chose, not the stale server
 * value.
 */
import { createStore } from '../../lib/store';
import { getSession } from '../../lib/sessionStore';
import { HttpError, Unauthenticated } from '../../lib/jellyfinErrors';

/** userId → itemId → liked? */
export type LikeOutbox = Record<string, Record<string, boolean>>;

const parse = (raw: unknown): LikeOutbox =>
  raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as LikeOutbox) : {};

export const likeOutboxStore = createStore<LikeOutbox>(
  {},
  { persistKey: 'cadence.like-outbox', parse },
);

const userId = (): string => getSession()?.userId ?? '';

/** The current user's pending wish for `itemId`, or undefined when none. */
export function pendingLike(
  itemId: string,
  box: LikeOutbox = likeOutboxStore.get(),
): boolean | undefined {
  return box[userId()]?.[itemId];
}

/** Keep `liked` as the user's wish for `itemId` until it reaches the server. */
export function queueLike(itemId: string, liked: boolean): void {
  const user = userId();
  if (!user) return;
  const box = likeOutboxStore.get();
  likeOutboxStore.set({ ...box, [user]: { ...box[user], [itemId]: liked } });
}

/** Forget the pending wish for `itemId` (it reached the server, or is moot). */
export function clearLike(itemId: string, user: string = userId()): void {
  const box = likeOutboxStore.get();
  if (!box[user] || !(itemId in box[user])) return;
  const rest = { ...box[user] };
  delete rest[itemId];
  const next = { ...box };
  if (Object.keys(rest).length) next[user] = rest;
  else delete next[user];
  likeOutboxStore.set(next);
}

/** True for a failure that means "couldn't reach the server" (keep the wish),
 * as opposed to the server answering no (an HTTP error, or a dead session). */
export function isUnreachable(error: unknown): boolean {
  return !(error instanceof HttpError) && !(error instanceof Unauthenticated);
}

/**
 * Send every pending wish for the signed-in user. A wish the server accepts is
 * cleared; one it REJECTS (e.g. the item was deleted) is dropped, never retried
 * forever; one that can't reach the server stays for next time. Returns how many
 * reached the server.
 */
export async function flushLikes(
  send: (itemId: string, liked: boolean) => Promise<void>,
): Promise<number> {
  const user = userId();
  const pending = Object.entries(likeOutboxStore.get()[user] ?? {});
  let sent = 0;
  for (const [itemId, liked] of pending) {
    try {
      await send(itemId, liked);
      clearLike(itemId, user);
      sent++;
    } catch (err) {
      if (isUnreachable(err)) break; // still offline — stop, keep the rest
      clearLike(itemId, user);
    }
  }
  return sent;
}
