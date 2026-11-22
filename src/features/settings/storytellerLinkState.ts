/**
 * The Settings "Storyteller" card's ONE state. It used to be tempting to hold
 * `linked`, `busy`, `error` and `username` side by side; instead every phase is
 * one variant, so "connecting" can't also show "connected", and an error names
 * what went wrong without a stale username next to it.
 */
export type StorytellerLinkState =
  | { kind: 'loading' } // asking the plugin whether this user is linked
  | { kind: 'unlinked' }
  | { kind: 'connecting' }
  | { kind: 'linked'; username: string }
  | { kind: 'error'; message: string };

/** Map a failed link attempt to copy the user can act on. */
export function linkErrorMessage(error: unknown): string {
  const status = (error as { status?: number } | null)?.status;
  const name = (error as { name?: string } | null)?.name;
  if (name === 'Unauthenticated' || status === 401) return 'Wrong username or password.';
  if (status === 502) return 'Storyteller is unreachable right now.';
  if (status === 404) return 'Your server has no Storyteller bridge configured.';
  return 'Could not connect. Try again.';
}
