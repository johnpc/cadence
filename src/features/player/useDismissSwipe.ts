import { useRef } from 'react';
import { isDismissSwipe } from './dismissSwipe';

/** Pointer-based swipe-down-to-dismiss. Returns props to spread onto the sheet's
 * top zone; a deliberate downward flick fires onDismiss once on release. */
export function useDismissSwipe(onDismiss: () => void) {
  const start = useRef<{ x: number; y: number } | null>(null);
  return {
    onPointerDown: (e: React.PointerEvent) => {
      start.current = { x: e.clientX, y: e.clientY };
    },
    onPointerUp: (e: React.PointerEvent) => {
      const s = start.current;
      start.current = null;
      if (s && isDismissSwipe(e.clientX - s.x, e.clientY - s.y)) onDismiss();
    },
  };
}
