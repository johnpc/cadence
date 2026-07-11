import { render, screen, fireEvent, createEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useDismissSwipe } from './useDismissSwipe';
import { DISMISS_THRESHOLD } from './dismissSwipe';

function Dismissable({ onDismiss }: { onDismiss: () => void }) {
  const props = useDismissSwipe(onDismiss);
  return <div data-testid="target" {...props} />;
}

// jsdom's PointerEvent ignores clientX/Y from fireEvent init; define them.
function pointer(el: Element, type: 'pointerDown' | 'pointerUp', x: number, y: number) {
  const ev = type === 'pointerDown' ? createEvent.pointerDown(el) : createEvent.pointerUp(el);
  Object.defineProperty(ev, 'clientX', { value: x });
  Object.defineProperty(ev, 'clientY', { value: y });
  fireEvent(el, ev);
}

function drag(dx: number, dy: number) {
  const el = screen.getByTestId('target');
  pointer(el, 'pointerDown', 100, 100);
  pointer(el, 'pointerUp', 100 + dx, 100 + dy);
}

describe('useDismissSwipe', () => {
  it('fires onDismiss for a downward flick', () => {
    const onDismiss = vi.fn();
    render(<Dismissable onDismiss={onDismiss} />);
    drag(5, DISMISS_THRESHOLD + 20);
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('does not fire for an upward drag', () => {
    const onDismiss = vi.fn();
    render(<Dismissable onDismiss={onDismiss} />);
    drag(0, -(DISMISS_THRESHOLD + 20));
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('ignores an orphan pointerup with no pointerdown', () => {
    const onDismiss = vi.fn();
    render(<Dismissable onDismiss={onDismiss} />);
    pointer(screen.getByTestId('target'), 'pointerUp', 100, 300);
    expect(onDismiss).not.toHaveBeenCalled();
  });
});
