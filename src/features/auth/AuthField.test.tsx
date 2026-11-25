import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AuthField } from './AuthField';

describe('AuthField', () => {
  it('types exactly what the user typed: no auto-capitalise, auto-correct or spell-check', () => {
    render(<AuthField label="Username" type="text" value="" onChange={vi.fn()} testId="u" />);
    const input = screen.getByTestId('u');
    expect(input).toHaveAttribute('autocapitalize', 'none');
    expect(input).toHaveAttribute('autocorrect', 'off');
    expect(input).toHaveAttribute('spellcheck', 'false');
  });
});
