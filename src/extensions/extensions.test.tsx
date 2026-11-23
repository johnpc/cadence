import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
vi.mock('../lib/runtimeConfig', () => ({
  lidarrProxyEnabled: vi.fn(() => true),
  deezerImportEnabled: vi.fn(() => false),
}));
vi.mock('../lib/musicGrabberStore', () => ({ musicGrabberConfigured: vi.fn(() => false) }));
vi.mock('./requests/RequestPrompt', () => ({
  RequestPrompt: ({ query }: { query: string }) => <p>request {query}</p>,
}));
vi.mock('./grab/GrabPrompt', () => ({
  GrabPrompt: ({ query }: { query: string }) => <p>grab {query}</p>,
}));
vi.mock('./deezer/DeezerMissingArtists', () => ({
  DeezerMissingArtists: ({ playlistId }: { playlistId: string }) => <p>missing {playlistId}</p>,
}));
vi.mock('./grab/GrabBackend', () => ({ GrabBackend: () => <p>grab settings</p> }));
const session = vi.hoisted(() => ({
  value: { token: 't', userId: 'u', isAdmin: true } as {
    token: string;
    userId: string;
    isAdmin?: boolean;
  } | null,
}));
vi.mock('../lib/sessionStore', () => ({ getSession: () => session.value }));
import { isExtensionEnabled } from './flags';
import { musicGrabberConfigured } from '../lib/musicGrabberStore';
import { SearchEmptyExtras } from './slots/SearchEmptyExtras';
import { PlaylistExtras } from './slots/PlaylistExtras';
import { SettingsExtras } from './slots/SettingsExtras';

describe('extensions', () => {
  it('each flag is its deployment predicate', () => {
    expect(isExtensionEnabled('requests')).toBe(true);
    expect(isExtensionEnabled('deezerImport')).toBe(false);
    expect(isExtensionEnabled('grab')).toBe(false);
  });

  it('slots render their extensions', () => {
    render(
      <>
        <SearchEmptyExtras query="rare b-side" show />
        <PlaylistExtras playlistId="pl1" />
        <SettingsExtras />
      </>,
    );
    expect(screen.getByText('request rare b-side')).toBeInTheDocument();
    expect(screen.getByText('grab rare b-side')).toBeInTheDocument();
    expect(screen.getByText('missing pl1')).toBeInTheDocument();
    expect(screen.getByText('grab settings')).toBeInTheDocument();
  });

  it('offers the Grab server settings to admins only (unless one is already set)', () => {
    session.value = { token: 't', userId: 'u', isAdmin: false };
    const { unmount } = render(<SettingsExtras />);
    expect(screen.queryByText('grab settings')).toBeNull();
    unmount();
    vi.mocked(musicGrabberConfigured).mockReturnValue(true);
    render(<SettingsExtras />);
    expect(screen.getByText('grab settings')).toBeInTheDocument();
  });
});
