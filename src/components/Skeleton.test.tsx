import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Skeleton, ShelfSkeleton, TrackListSkeleton } from './Skeleton';

describe('Skeleton', () => {
  it('renders a block with the given size', () => {
    const { container } = render(<Skeleton width={50} height={20} />);
    const el = container.querySelector('.skeleton') as HTMLElement;
    expect(el).toBeInTheDocument();
    expect(el.style.width).toBe('50px');
  });

  it('renders a shelf of card placeholders', () => {
    render(<ShelfSkeleton count={3} />);
    expect(
      screen.getByTestId('skeleton-shelf').querySelectorAll('.skeleton-shelf__card'),
    ).toHaveLength(3);
  });

  it('renders a list of row placeholders', () => {
    render(<TrackListSkeleton count={5} />);
    expect(
      screen.getByTestId('skeleton-list').querySelectorAll('.skeleton-list__row'),
    ).toHaveLength(5);
  });
});
