import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Library } from './Library';

describe('Library', () => {
  it('renders the library placeholder', () => {
    render(<Library />);
    expect(screen.getByTestId('library-placeholder')).toBeInTheDocument();
  });
});
