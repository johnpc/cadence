import { afterEach, describe, expect, it, vi } from 'vitest';

const { sendMessage } = vi.hoisted(() => ({ sendMessage: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@hauxir2/capacitor-chromecast', () => ({ Chromecast: { sendMessage } }));
vi.mock('../../lib/jellyfinStream', () => ({ imageUrl: () => 'https://jf.test/art.jpg' }));

import { sendNowPlaying, sendQueue } from './castBroadcast';
import { setCastState } from './castStore';
import { CAST_NAMESPACE } from './castMessages';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const track = { Id: 't1', Name: 'Song', Type: 'Audio', Artists: ['A'] } as JellyfinItem;
const connect = (on: boolean) =>
  setCastState({ connected: on, deviceName: on ? 'TV' : '', playing: on });
const setAppId = (id: string | undefined) => {
  window.__CADENCE_CONFIG__ = id ? { castReceiverAppId: id } : {};
};

describe('castBroadcast', () => {
  afterEach(() => {
    vi.clearAllMocks();
    connect(false);
    delete window.__CADENCE_CONFIG__;
  });

  it('sends now-playing on the custom namespace when connected + custom receiver set', async () => {
    connect(true);
    setAppId('A1B2C3D4');
    await sendNowPlaying(track, true);
    expect(sendMessage).toHaveBeenCalledOnce();
    const arg = sendMessage.mock.calls[0][0];
    expect(arg.namespace).toBe(CAST_NAMESPACE);
    expect(JSON.parse(arg.message)).toMatchObject({ type: 'nowPlaying', title: 'Song' });
  });

  it('sends the queue when connected + custom receiver set', async () => {
    connect(true);
    setAppId('A1B2C3D4');
    await sendQueue([track], 0);
    expect(JSON.parse(sendMessage.mock.calls[0][0].message)).toMatchObject({
      type: 'queue',
      index: 0,
    });
  });

  it('is a no-op when not connected', async () => {
    connect(false);
    setAppId('A1B2C3D4');
    await sendNowPlaying(track, true);
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('is a no-op with the default receiver (no custom app id)', async () => {
    connect(true);
    setAppId(undefined);
    await sendNowPlaying(track, true);
    await sendQueue([track], 0);
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('swallows a failed send (best-effort)', async () => {
    connect(true);
    setAppId('A1B2C3D4');
    sendMessage.mockRejectedValueOnce(new Error('gone'));
    await expect(sendNowPlaying(track, true)).resolves.toBeUndefined();
  });
});
