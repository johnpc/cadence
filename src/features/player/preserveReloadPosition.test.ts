import { describe, expect, it } from 'vitest';
import { preserveReloadPosition } from './preserveReloadPosition';
import { takePendingSeek } from './pendingSeek';

const audioAt = (currentTime: number) => ({ currentTime }) as HTMLAudioElement;

describe('preserveReloadPosition', () => {
  it('stashes the position as a pending seek for the track', () => {
    preserveReloadPosition('t1', audioAt(4321));
    expect(takePendingSeek('t1')).toBe(4321);
  });

  it('ignores positions at the very start (nothing worth preserving)', () => {
    preserveReloadPosition('t1', audioAt(0.5));
    expect(takePendingSeek('t1')).toBeNull();
  });

  it('is a no-op without a track id or element', () => {
    preserveReloadPosition(undefined, audioAt(100));
    preserveReloadPosition('t1', null);
    expect(takePendingSeek('t1')).toBeNull();
  });
});
