import { useEffect, useState } from 'react';
import { isCastAvailable, castTrack, stopCast } from './castController';
import { getCastState, onCastStateChange } from './castStore';
import { useToast } from '../toast/useToast';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/**
 * Cast session as reactive state for the UI: whether cast is offered on this
 * platform, whether we're connected, the device name, and cast/stop actions.
 * Errors (user dismisses the picker, no devices) toast rather than throw.
 */
export function useCast() {
  const toast = useToast();
  const [state, setState] = useState(getCastState);
  useEffect(() => onCastStateChange(() => setState(getCastState())), []);

  return {
    available: isCastAvailable(),
    connected: state.connected,
    deviceName: state.deviceName,
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
