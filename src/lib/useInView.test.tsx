import { render, screen, act } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useInView } from './useInView';

function Probe({ rootMargin }: { rootMargin?: string }) {
  const { ref, inView } = useInView(rootMargin);
  return (
    <div ref={ref} data-testid="probe">
      {String(inView)}
    </div>
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useInView', () => {
  it('falls back to inView=true when IntersectionObserver is unavailable', () => {
    // jsdom has no IntersectionObserver — the hook must not hide content.
    render(<Probe />);
    expect(screen.getByTestId('probe')).toHaveTextContent('true');
  });

  it('stays false until the sentinel intersects, then latches true', () => {
    let trigger: (entries: { isIntersecting: boolean }[]) => void = () => {};
    const disconnect = vi.fn();
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(cb: (e: { isIntersecting: boolean }[]) => void) {
          trigger = cb;
        }
        observe() {}
        disconnect = disconnect;
      },
    );
    render(<Probe />);
    expect(screen.getByTestId('probe')).toHaveTextContent('false');
    act(() => trigger([{ isIntersecting: true }]));
    expect(screen.getByTestId('probe')).toHaveTextContent('true');
    expect(disconnect).toHaveBeenCalled(); // one-way latch: stops observing
  });

  it('ignores non-intersecting callbacks', () => {
    let trigger: (entries: { isIntersecting: boolean }[]) => void = () => {};
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(cb: (e: { isIntersecting: boolean }[]) => void) {
          trigger = cb;
        }
        observe() {}
        disconnect() {}
      },
    );
    render(<Probe />);
    act(() => trigger([{ isIntersecting: false }]));
    expect(screen.getByTestId('probe')).toHaveTextContent('false');
  });
});
