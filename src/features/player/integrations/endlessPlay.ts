import { watch } from '../../../lib/store';
import { getInstantMix } from '../../../lib/jellyfinItems';
import { onAutoplayChange, readAutoplay } from '../../settings/autoplayStore';
import type { JellyfinItem } from '../../../lib/jellyfinTypes';
import type { PlayerEngine } from '../engine/types';

export interface EndlessPlayDeps {
  mix(seedId: string): Promise<JellyfinItem[]>;
  autoplay(): boolean;
  onAutoplayChange(listener: (on: boolean) => void): () => void;
}

const defaults: EndlessPlayDeps = {
  mix: (id) => getInstantMix(id),
  autoplay: readAutoplay,
  onAutoplayChange,
};

/**
 * Spotify-style endless play: when the queue reaches its last track (repeat
 * off, Autoplay on), fetch an instant-mix radio seeded from that track and
 * append it, so music never just stops. Seeds once per tail track. A mix that
 * lands after the queue moved on (a new album started) is dropped instead of
 * being appended to the wrong queue.
 */
export function attachEndlessPlay(
  engine: Pick<PlayerEngine, 'state' | 'addToQueue'>,
  deps: EndlessPlayDeps = defaults,
): () => void {
  let seededFor: string | null = null;
  const tailId = () => {
    const { tracks } = engine.state.get().queue;
    return tracks[tracks.length - 1]?.Id ?? null;
  };
  const check = () => {
    const s = engine.state.get();
    const seed = tailId();
    const atEnd = s.queue.index >= s.queue.tracks.length - 1;
    if (!seed || !atEnd || s.repeat !== 'off' || !deps.autoplay() || seededFor === seed) return;
    seededFor = seed;
    void deps.mix(seed).then(
      (mix) => {
        const fresh = mix.filter((t) => t.Id !== seed);
        if (fresh.length && tailId() === seed) engine.addToQueue(fresh);
      },
      () => undefined,
    );
  };
  const offState = watch(engine.state, (s) => s, check, { immediate: true });
  const offAutoplay = deps.onAutoplayChange(check);
  return () => {
    offState();
    offAutoplay();
  };
}
