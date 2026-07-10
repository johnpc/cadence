import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

// IonModal needs a framework delegate that jsdom lacks — render its children
// inline when open (mirrors the LyricsSheet test).
vi.mock('@ionic/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@ionic/react')>();
  return {
    ...actual,
    IonModal: ({ isOpen, children }: { isOpen: boolean; children: ReactNode }) =>
      isOpen ? <div>{children}</div> : null,
  };
});
import { KeyboardShortcutsHelp } from './KeyboardShortcutsHelp';
import { SHORTCUTS } from './shortcutList';

describe('KeyboardShortcutsHelp', () => {
  it('lists every shortcut with its keys and label when open', () => {
    render(<KeyboardShortcutsHelp open onClose={vi.fn()} />);
    expect(screen.getByTestId('shortcuts-help')).toBeInTheDocument();
    expect(screen.getAllByTestId('shortcut-row')).toHaveLength(SHORTCUTS.length);
    // A representative shortcut renders its label and its key chip.
    expect(screen.getByText('Play / pause')).toBeInTheDocument();
    expect(screen.getByText('Space')).toBeInTheDocument();
  });

  it('calls onClose when the close button is tapped', async () => {
    const onClose = vi.fn();
    render(<KeyboardShortcutsHelp open onClose={onClose} />);
    await userEvent.click(screen.getByRole('button', { name: /close shortcuts/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('renders nothing visible when closed', () => {
    render(<KeyboardShortcutsHelp open={false} onClose={vi.fn()} />);
    expect(screen.queryByTestId('shortcuts-help')).not.toBeInTheDocument();
  });
});
