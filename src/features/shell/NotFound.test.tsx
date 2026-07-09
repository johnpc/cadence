import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryHistory } from 'history';
import { Router } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { NotFound } from './NotFound';

function renderNotFound() {
  const history = createMemoryHistory({ initialEntries: ['/nope'] });
  render(
    <Router history={history}>
      <NotFound />
    </Router>,
  );
  return history;
}

describe('NotFound', () => {
  it('shows a friendly 404 message', () => {
    renderNotFound();
    expect(screen.getByTestId('not-found')).toBeInTheDocument();
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText(/couldn.t find that page/i)).toBeInTheDocument();
  });

  it('sends the user home when "Go home" is tapped', async () => {
    const history = renderNotFound();
    await userEvent.click(screen.getByTestId('not-found-home'));
    expect(history.location.pathname).toBe('/home');
  });
});
