import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { RequestPrompt } from './RequestPrompt';

function renderPrompt(query: string, show: boolean) {
  return render(
    <MemoryRouter>
      <RequestPrompt query={query} show={show} />
    </MemoryRouter>,
  );
}

afterEach(() => {
  delete window.__CADENCE_CONFIG__;
});

describe('RequestPrompt', () => {
  it('offers to request the query when the search is empty + the proxy is on', () => {
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

  it('renders nothing for a blank query', () => {
    window.__CADENCE_CONFIG__ = { lidarrProxy: true };
    renderPrompt('   ', true);
    expect(screen.queryByTestId('search-request-prompt')).not.toBeInTheDocument();
  });
});
