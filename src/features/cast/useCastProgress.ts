import { useStore } from '../../lib/store';
import { castProgressStore } from './castProgress';

/** The receiver's live position/duration while casting, as reactive state. */
export function useCastProgress() {
  return useStore(castProgressStore);
}
