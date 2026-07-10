import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** Where the current queue was started from — "Playing from PLAYLIST · Chill
 * Mix", Spotify-style. Session-only (in memory): a fresh launch has no context
 * until the user plays a collection. `trackIds` fingerprints the collection so
 * the header self-clears once playback drifts off it (e.g. endless radio). */
export interface PlayContext {
  kind: string;
  label: string;
  /** The route back to the source collection (e.g. /playlist/:id), so the
   * "Playing from" header can link there. Omitted for contexts with no page
   * (e.g. a genre radio built from mixed sources). */
  path?: string;
  trackIds: Set<string>;
}

let current: PlayContext | null = null;
const listeners = new Set<() => void>();

function emit(): void {
  for (const l of listeners) l();
}

/** Record the collection a play started from. Passing null clears it (e.g. when
 * a single track is played from search, which has no collection context). */
export function setPlayContext(
  ctx: { kind: string; label: string; path?: string; tracks: JellyfinItem[] } | null,
): void {
  current = ctx
    ? {
        kind: ctx.kind,
        label: ctx.label,
        path: ctx.path,
        trackIds: new Set(ctx.tracks.map((t) => t.Id)),
      }
    : null;
  emit();
}

export function getPlayContext(): PlayContext | null {
  return current;
}

export function subscribePlayContext(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** The context to show for the currently-playing track: the stored context only
 * while that track still belongs to it, else null — so the label disappears the
 * moment playback leaves the collection (endless radio, a different queue). */
export function contextFor(trackId: string | undefined): PlayContext | null {
  if (!current || !trackId || !current.trackIds.has(trackId)) return null;
  return current;
}
