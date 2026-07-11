import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { open } = vi.hoisted(() => ({ open: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@capacitor/browser', () => ({ Browser: { open } }));
import { Feedback } from './Feedback';

describe('Feedback', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('opens a prefilled bug issue', async () => {
    render(<Feedback />);
    await userEvent.click(screen.getByTestId('report-bug'));
    expect(open).toHaveBeenCalledOnce();
    const url = open.mock.calls[0][0].url as string;
    expect(url).toContain('/issues/new');
    expect(new URL(url).searchParams.get('title')).toBe('[bug] ');
  });

  it('opens a prefilled feature issue', async () => {
    render(<Feedback />);
    await userEvent.click(screen.getByTestId('request-feature'));
    const url = open.mock.calls[0][0].url as string;
    expect(new URL(url).searchParams.get('title')).toBe('[feature] ');
  });
});
