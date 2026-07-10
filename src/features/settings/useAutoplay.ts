import { useEffect, useState } from 'react';
import { readAutoplay, writeAutoplay, onAutoplayChange } from './autoplayStore';

/** The Autoplay preference as reactive state + a setter. Subscribes to the
 * store so the Settings toggle and the player (useEndlessPlay) stay in sync. */
export function useAutoplay(): { autoplay: boolean; setAutoplay: (on: boolean) => void } {
  const [autoplay, setState] = useState(readAutoplay);
  useEffect(() => onAutoplayChange(setState), []);
  return { autoplay, setAutoplay: writeAutoplay };
}
