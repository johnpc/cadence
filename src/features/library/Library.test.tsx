import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { Library } from './Library';

describe('Library', () => {
  it('renders the library placeholder and a settings link', () => {
    render(
      <MemoryRouter>
        <Library />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('library-placeholder')).toBeInTheDocument();
    expect(screen.getByTestId('library-settings')).toBeInTheDocument();
  });
});
