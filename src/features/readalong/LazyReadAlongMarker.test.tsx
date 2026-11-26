import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./storytellerApi', () => ({ getReadAlongLibrary: vi.fn() }));
vi.mock('../../lib/runtimeConfig', () => ({ storytellerEnabled: vi.fn() }));
import { getReadAlongLibrary } from './storytellerApi';
import { storytellerEnabled } from '../../lib/runtimeConfig';
import { LazyReadAlongMarker } from './LazyReadAlongMarker';
import { renderWithProviders } from '../../test/renderWithProviders';

const book = { id: 'p1', parts: [{ Id: 'p1' }] };

afterEach(() => {
  vi.resetAllMocks();
});

describe('LazyReadAlongMarker', () => {
  it('renders nothing (and loads nothing) without a Storyteller bridge', () => {
    vi.mocked(storytellerEnabled).mockReturnValue(false);
    const { container } = renderWithProviders(<LazyReadAlongMarker book={book} />);
    expect(container).toBeEmptyDOMElement();
    expect(getReadAlongLibrary).not.toHaveBeenCalled();
  });

  it('shows the badge once its chunk and the library list load', async () => {
    vi.mocked(storytellerEnabled).mockReturnValue(true);
    vi.mocked(getReadAlongLibrary).mockResolvedValue({
      Status: 'ok',
      Books: [{ ItemId: 'p1', Status: 'ready' }],
    });
    renderWithProviders(<LazyReadAlongMarker book={book} />);
    expect(await screen.findByTestId('readalong-badge')).toHaveTextContent('Read along');
  });
});
