import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BarPage } from './BarPage';
import { pageTitleProps } from './usePageBar';

describe('BarPage', () => {
  it('gives a tab root its large title as the page h1, with the compact title in the bar', () => {
    render(
      <BarPage kind="tab-root" title="Your Library" end={<button>Settings</button>}>
        <p>rows</p>
      </BarPage>,
    );
    const h1 = screen.getByRole('heading', { level: 1, name: 'Your Library' });
    expect(h1).toHaveAttribute('data-page-title');
    // …and once more as the bar's compact title, which fades in on scroll.
    expect(screen.getAllByText('Your Library')).toHaveLength(2);
    expect(screen.getByTestId('page-bar')).toHaveAttribute('data-bar', 'clear');
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('rows')).toBeInTheDocument();
  });

  it('leaves a detail page to mark its own title, with Back in the bar', () => {
    const { container } = render(
      <BarPage kind="detail" title="Harbor Winds" start={<button>Back</button>}>
        <h1 {...pageTitleProps}>Harbor Winds</h1>
      </BarPage>,
    );
    expect(container.querySelector('.bar-page--detail')).not.toBeNull();
    expect(screen.queryByTestId('page-title')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveAttribute('data-page-title');
    expect(screen.getByText('Back')).toBeInTheDocument();
  });
});
