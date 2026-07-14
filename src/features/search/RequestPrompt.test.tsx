import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../auth/useIsAdmin', () => ({ useIsAdmin: vi.fn(() => true) }));
import { useIsAdmin } from '../auth/useIsAdmin';
import { RequestPrompt } from './RequestPrompt';

function renderPrompt(query: string, show: boolean) {
  return render(
    <MemoryRouter>
      <RequestPrompt query={query} show={show} />
    </MemoryRouter>,
  );
}

afterEach(() => {
  vi.mocked(useIsAdmin).mockReturnValue(true);
  delete window.__CADENCE_CONFIG__;
});

describe('RequestPrompt', () => {
  it('offers to request the query when empty + admin + proxy on', () => {
    window.__CADENCE_CONFIG__ = { lidarrProxy: true };
    renderPrompt('boygenius', true);
    const cta = screen.getByTestId('search-request-cta');
    expect(cta).toHaveTextContent('Request');
    expect(cta.getAttribute('router-link') ?? cta.closest('a')?.getAttribute('href')).toContain(
      '/requests?q=boygenius',
    );
  });

  it('renders nothing when the search was not empty', () => {
    window.__CADENCE_CONFIG__ = { lidarrProxy: true };
    renderPrompt('boygenius', false);
    expect(screen.queryByTestId('search-request-prompt')).not.toBeInTheDocument();
  });

  it('renders nothing when the Lidarr proxy is not deployed', () => {
    renderPrompt('boygenius', true); // no config → proxy off
    expect(screen.queryByTestId('search-request-prompt')).not.toBeInTheDocument();
  });

  it('renders nothing for a non-admin', () => {
    window.__CADENCE_CONFIG__ = { lidarrProxy: true };
    vi.mocked(useIsAdmin).mockReturnValue(false);
    renderPrompt('boygenius', true);
    expect(screen.queryByTestId('search-request-prompt')).not.toBeInTheDocument();
  });

  it('renders nothing for a blank query', () => {
    window.__CADENCE_CONFIG__ = { lidarrProxy: true };
    renderPrompt('   ', true);
    expect(screen.queryByTestId('search-request-prompt')).not.toBeInTheDocument();
  });
});
