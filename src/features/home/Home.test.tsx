import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Home } from './Home';

describe('Home', () => {
  it('renders the recommendations placeholder', () => {
    render(<Home />);
    expect(screen.getByTestId('home-placeholder')).toBeInTheDocument();
  });
});
