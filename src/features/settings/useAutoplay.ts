import { useStore } from '../../lib/store';
import { autoplayStore, writeAutoplay } from './autoplayStore';

/** The Autoplay preference as reactive state + a setter. */
export function useAutoplay(): { autoplay: boolean; setAutoplay: (on: boolean) => void } {
  return { autoplay: useStore(autoplayStore), setAutoplay: writeAutoplay };
}
