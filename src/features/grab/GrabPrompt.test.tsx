import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/musicGrabberStore', () => ({ musicGrabberConfigured: vi.fn() }));
// The sheet pulls in hooks/clients — stub it to a marker so this test is unit-scoped.
vi.mock('./GrabSheet', () => ({ GrabSheet: () => <div data-testid="grab-sheet-stub" /> }));
import { musicGrabberConfigured } from '../../lib/musicGrabberStore';
import { GrabPrompt } from './GrabPrompt';

afterEach(() => {
  vi.resetAllMocks();
});

describe('GrabPrompt', () => {
  it('renders nothing when Grab is not configured', () => {
    vi.mocked(musicGrabberConfigured).mockReturnValue(false);
    const { container } = render(<GrabPrompt query="creep" show />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when not shown or query blank', () => {
    vi.mocked(musicGrabberConfigured).mockReturnValue(true);
    const { container: a } = render(<GrabPrompt query="creep" show={false} />);
    expect(a).toBeEmptyDOMElement();
    const { container: b } = render(<GrabPrompt query="   " show />);
    expect(b).toBeEmptyDOMElement();
  });

  it('shows the grab CTA when configured + shown', () => {
    vi.mocked(musicGrabberConfigured).mockReturnValue(true);
    render(<GrabPrompt query="creep" show />);
    expect(screen.getByTestId('search-grab-cta')).toHaveTextContent(/Grab .creep./);
  });
});
