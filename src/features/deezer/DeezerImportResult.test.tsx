import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@ionic/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@ionic/react')>();
  return {
    ...actual,
    // routerLink → a plain anchor so we don't need a router in the test.
    IonButton: ({
      children,
      routerLink,
      ...rest
    }: React.ComponentProps<'a'> & { routerLink?: string }) => (
      <a href={routerLink} {...rest}>
        {children}
      </a>
    ),
    IonSpinner: () => <span data-testid="spinner" />,
  };
});

import { DeezerImportResult } from './DeezerImportResult';

const base = {
  PlaylistId: 'pl1',
  PlaylistName: 'En mode 60',
  AddedCount: 4,
  TotalCount: 50,
  MissingArtists: ['The Beatles', 'Louis Armstrong'],
};

describe('DeezerImportResult', () => {
  it('summarises the counts and links to the new playlist', () => {
    render(<DeezerImportResult result={base} status={{}} onRequest={vi.fn()} />);
    expect(screen.getByTestId('deezer-result')).toHaveTextContent('4');
    expect(screen.getByTestId('deezer-result')).toHaveTextContent('50');
    expect(screen.getByTestId('deezer-open-playlist')).toHaveAttribute('href', '/playlist/pl1');
  });

  it('lists each missing artist', () => {
    render(<DeezerImportResult result={base} status={{}} onRequest={vi.fn()} />);
    expect(screen.getAllByTestId('deezer-missing-row')).toHaveLength(2);
    expect(screen.getByText('The Beatles')).toBeInTheDocument();
  });

  it('omits the missing section when nothing is missing', () => {
    render(
      <DeezerImportResult
        result={{ ...base, MissingArtists: [] }}
        status={{}}
        onRequest={vi.fn()}
      />,
    );
    expect(screen.queryByTestId('deezer-missing')).not.toBeInTheDocument();
  });
});
