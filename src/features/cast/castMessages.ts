import { imageUrl } from '../../lib/jellyfinStream';
import { artistLine } from '../player/playerFormat';
import type { JellyfinItem } from '../../lib/jellyfinTypes';
import type { LyricLine } from '../../lib/jellyfinLyrics';

/**
 * The custom-namespace message protocol between the app and the Cast receiver
 * web app. The default media receiver ignores these; a custom receiver (see
 * receiver/) renders the now-playing art + a visualizer + a live queue from them.
 * Kept tiny + serialisable — sent via Chromecast.sendMessage as JSON.
 */
export const CAST_NAMESPACE = 'urn:x-cast:io.jpc.cadence';

export interface NowPlayingMessage {
  type: 'nowPlaying';
  title: string;
  artist: string;
  artUrl: string | null;
  isPlaying: boolean;
}

export interface QueueMessage {
  type: 'queue';
  index: number;
  tracks: { title: string; artist: string }[];
}

export interface LyricsMessage {
  type: 'lyrics';
  /** All lines; `start` (seconds) present on synced (LRC) lyrics. */
  lines: { text: string; start?: number }[];
  /** Index of the currently-active line, or -1 (unsynced / before first line). */
  activeIndex: number;
}

export type CastMessage = NowPlayingMessage | QueueMessage | LyricsMessage;

/** Build the now-playing message for the receiver from the current track. */
export function nowPlayingMessage(track: JellyfinItem, isPlaying: boolean): NowPlayingMessage {
  return {
    type: 'nowPlaying',
    title: track.Name,
    artist: artistLine(track),
    artUrl: imageUrl(track, 800),
    isPlaying,
  };
}

/** Build the live-queue message: the upcoming order + the current index, so the
 * receiver can highlight "now playing" and show what's next. Capped so a huge
 * queue doesn't bloat the message. */
export function queueMessage(tracks: JellyfinItem[], index: number): QueueMessage {
  return {
    type: 'queue',
    index,
    tracks: tracks.slice(0, 50).map((t) => ({ title: t.Name, artist: artistLine(t) })),
  };
}

/** Build the lyrics message: the lines (with timing where synced) + the active
 * line index, so the receiver can karaoke-highlight the current line. */
export function lyricsMessage(lines: LyricLine[], activeIndex: number): LyricsMessage {
  return {
    type: 'lyrics',
    lines: lines.map((l) => ({ text: l.text, start: l.start })),
    activeIndex,
  };
}
