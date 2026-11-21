/**
 * Read-along has exactly ONE state at a time — never "isLoading && !book &&
 * !error" clusters. Everything the sheet renders derives from this union.
 */
import type { ReadAlongBook, ReadAlongStatus } from './storytellerApi';

/** Why read-along can't run for the current track right now. */
export type ReadAlongUnavailableReason =
  | 'no-plugin' // the server has no Storyteller bridge configured
  | 'not-a-book' // the current track is music, or nothing is playing
  | Exclude<ReadAlongStatus, 'ready'>; // the plugin's own verdict on this book

export type ReadAlongState =
  /** The feature is off (flag absent) or has nothing to apply to. */
  | { kind: 'unavailable'; reason: ReadAlongUnavailableReason }
  | { kind: 'loading' }
  | { kind: 'error' }
  | { kind: 'ready'; book: ReadAlongBook };

/** Derive the one state from its inputs. Order matters: the flag and the track
 * are known synchronously and beat the query; an error beats a stale book. */
export function deriveReadAlongState(input: {
  enabled: boolean;
  isAudiobook: boolean;
  isLoading: boolean;
  isError: boolean;
  book: ReadAlongBook | undefined;
}): ReadAlongState {
  if (!input.enabled) return { kind: 'unavailable', reason: 'no-plugin' };
  if (!input.isAudiobook) return { kind: 'unavailable', reason: 'not-a-book' };
  if (input.isError) return { kind: 'error' };
  if (input.isLoading || !input.book) return { kind: 'loading' };
  if (input.book.Status !== 'ready') return { kind: 'unavailable', reason: input.book.Status };
  return { kind: 'ready', book: input.book };
}

/** Human copy for each unavailable reason (the sheet's empty state). */
export function unavailableCopy(reason: ReadAlongUnavailableReason): {
  title: string;
  message: string;
  settingsLink: boolean;
} {
  switch (reason) {
    case 'unlinked':
      return {
        title: 'Connect Storyteller',
        message: 'Connect Storyteller in Settings to read along while you listen.',
        settingsLink: true,
      };
    case 'unmatched':
      return {
        title: 'No matching book',
        message: 'No Storyteller book matches this title.',
        settingsLink: false,
      };
    case 'aligning':
      return {
        title: 'Still aligning',
        message: 'Storyteller is still aligning this book. Check back soon.',
        settingsLink: false,
      };
    case 'mismatch':
      return {
        title: 'Audio mismatch',
        message: "The Storyteller audio doesn't match this audiobook.",
        settingsLink: false,
      };
    case 'not-a-book':
      return {
        title: 'Nothing to read',
        message: 'Read along works with audiobooks.',
        settingsLink: false,
      };
    case 'no-plugin':
      return {
        title: 'Read along is off',
        message: 'Your server has no Storyteller bridge configured.',
        settingsLink: false,
      };
  }
}

/**
 * Whether the text follows the narration. ONE value, not `autoScroll &&
 * !userScrolled`: `following` scrolls the active sentence into view on every
 * change; `detached` (the reader scrolled away) leaves the page alone and shows
 * the "Jump to now" chip, which returns to `following`.
 */
export type FollowMode = 'following' | 'detached';
