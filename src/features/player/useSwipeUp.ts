import { useRef } from 'react';
import { isOpenSwipe } from './dismissSwipe';
import { tap } from '../../lib/haptics';

/** Pointer-based swipe-up detection. Returns props to spread onto an element; a
 * deliberate upward flick fires onOpen once on release, with a haptic tick —
 * used to pull the mini-player up into the full player. */
export function useSwipeUp(onOpen: () => void) {
  const start = useRef<{ x: number; y: number } | null>(null);
  return {
    onPointerDown: (e: React.PointerEvent) => {
      start.current = { x: e.clientX, y: e.clientY };
    },
    onPointerUp: (e: React.PointerEvent) => {
      const s = start.current;
      start.current = null;
      if (s && isOpenSwipe(e.clientX - s.x, e.clientY - s.y)) {
        tap();
        onOpen();
      }
    },
  };
}
