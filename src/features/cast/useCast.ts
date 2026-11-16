import { useStore } from '../../lib/store';
import { isCastAvailable, castTrack, stopCast } from './castController';
import { castStore } from './castStore';
import { useToast } from '../toast/useToast';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/**
 * Cast session as reactive state for the UI: whether cast is offered on this
 * platform, the session's one status (off / connecting / connected / lost), the
 * device name, and cast/stop actions. Errors (user dismisses the picker, no
 * devices) toast rather than throw.
 */
export function useCast() {
  const toast = useToast();
  const state = useStore(castStore);

  return {
    available: isCastAvailable(),
    status: state.status,
    connected: state.status === 'connected',
    connecting: state.status === 'connecting',
    deviceName: 'deviceName' in state ? state.deviceName : '',
    cast: async (track: JellyfinItem | null) => {
      if (!track) return;
      try {
        await castTrack(track);
      } catch {
        toast("Couldn't connect to a TV");
      }
    },
    stop: () => {
      void stopCast();
    },
  };
}
