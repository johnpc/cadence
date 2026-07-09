import { render, screen, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useProgressiveList } from './useProgressiveList';

// Capture the IntersectionObserver callback so we can fire it on demand.
let ioCallback: IntersectionObserverCallback | null = null;
beforeEach(() => {
  ioCallback = null;
  class FakeIO {
    constructor(cb: IntersectionObserverCallback) {
      ioCallback = cb;
    }
    observe() {}
    disconnect() {}
    unobserve() {}
    takeRecords() {
      return [];
    }
    root = null;
    rootMargin = '';
    thresholds = [];
  }
  vi.stubGlobal('IntersectionObserver', FakeIO);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

/** Mounts the hook and attaches its sentinel to a real element (the IO only
 * observes when the sentinel exists), exposing the live limit via data-attr. */
function Harness({ count, initial, step }: { count: number; initial: number; step: number }) {
  const { limit, sentinelRef, hasMore } = useProgressiveList(count, initial, step);
  return (
    <div>
      <span data-testid="limit">{limit}</span>
      <span data-testid="more">{String(hasMore)}</span>
      {hasMore && <div ref={sentinelRef} data-testid="sentinel" />}
    </div>
  );
}

const fire = () =>
  act(() =>
    ioCallback?.(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    ),
  );

describe('useProgressiveList', () => {
  it('starts at the initial window and reports more remaining', () => {
    render(<Harness count={500} initial={50} step={50} />);
    expect(screen.getByTestId('limit')).toHaveTextContent('50');
    expect(screen.getByTestId('more')).toHaveTextContent('true');
  });

  it('grows by step when the sentinel intersects, then stops at count', () => {
    render(<Harness count={120} initial={50} step={50} />);
    fire();
    expect(screen.getByTestId('limit')).toHaveTextContent('100');
    fire();
    expect(screen.getByTestId('limit')).toHaveTextContent('120');
    expect(screen.getByTestId('more')).toHaveTextContent('false');
  });

  it('caps the window at the item count for a small list', () => {
    render(<Harness count={10} initial={50} step={50} />);
    expect(screen.getByTestId('limit')).toHaveTextContent('10');
    expect(screen.getByTestId('more')).toHaveTextContent('false');
  });
});
