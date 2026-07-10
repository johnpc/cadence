import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { RouteAnnouncer } from './RouteAnnouncer';

describe('RouteAnnouncer', () => {
  it('exposes a polite live region naming the current page', () => {
    render(
      <MemoryRouter initialEntries={['/library']}>
        <RouteAnnouncer />
      </MemoryRouter>,
    );
    const region = screen.getByTestId('route-announcer');
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region).toHaveTextContent('Your Library page');
  });

  it('announces the kind for a detail route', () => {
    render(
      <MemoryRouter initialEntries={['/album/xyz']}>
        <RouteAnnouncer />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('route-announcer')).toHaveTextContent('Album page');
  });

  it('announces the override instead of the route when given (e.g. Sign in)', () => {
    render(
      <MemoryRouter initialEntries={['/home']}>
        <RouteAnnouncer override="Sign in" />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('route-announcer')).toHaveTextContent('Sign in page');
  });
});
