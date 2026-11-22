import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../readalong/storytellerApi', () => ({
  getStorytellerLink: vi.fn(),
  linkStoryteller: vi.fn(),
  unlinkStoryteller: vi.fn(),
}));
import {
  getStorytellerLink,
  linkStoryteller,
  unlinkStoryteller,
} from '../readalong/storytellerApi';
import { StorytellerLink } from './StorytellerLink';
import { renderWithProviders } from '../../test/renderWithProviders';
import { HttpError, Unauthenticated } from '../../lib/jellyfinErrors';

async function fillAndConnect(username = 'reader', password = 'pw') {
  // IonInput in jsdom: drive the inner input and fire the ionInput event.
  const user = screen.getByTestId('storyteller-username');
  const pass = screen.getByTestId('storyteller-password');
  act(() => {
    user.dispatchEvent(new CustomEvent('ionInput', { detail: { value: username }, bubbles: true }));
    pass.dispatchEvent(new CustomEvent('ionInput', { detail: { value: password }, bubbles: true }));
  });
  await userEvent.click(screen.getByTestId('storyteller-connect'));
}

describe('StorytellerLink', () => {
  beforeEach(() => {
    window.__CADENCE_CONFIG__ = { storyteller: true };
    vi.mocked(getStorytellerLink).mockResolvedValue({ Linked: false, Username: null });
  });
  afterEach(() => {
    delete window.__CADENCE_CONFIG__;
    vi.resetAllMocks();
  });

  it('scrolls itself into view when opened via /settings#storyteller, and not otherwise', async () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    window.location.hash = '#storyteller';
    const first = renderWithProviders(<StorytellerLink />);
    await screen.findByTestId('storyteller-card');
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'start' });
    first.unmount();

    scrollIntoView.mockClear();
    window.location.hash = '';
    renderWithProviders(<StorytellerLink />);
    await screen.findByTestId('storyteller-card');
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it('renders nothing when the server has no Storyteller bridge', () => {
    delete window.__CADENCE_CONFIG__;
    renderWithProviders(<StorytellerLink />);
    expect(screen.queryByTestId('storyteller-card')).toBeNull();
    expect(getStorytellerLink).not.toHaveBeenCalled();
  });

  it('shows the connected account and can disconnect', async () => {
    vi.mocked(getStorytellerLink).mockResolvedValue({ Linked: true, Username: 'john' });
    vi.mocked(unlinkStoryteller).mockResolvedValue(undefined);
    renderWithProviders(<StorytellerLink />);
    expect(await screen.findByTestId('storyteller-linked')).toHaveTextContent('Connected as john');
    await userEvent.click(screen.getByTestId('storyteller-disconnect'));
    await waitFor(() => expect(screen.getByTestId('storyteller-connect')).toBeInTheDocument());
    expect(unlinkStoryteller).toHaveBeenCalled();
  });

  it('connects with a username and password and shows the linked name', async () => {
    vi.mocked(linkStoryteller).mockResolvedValue({ Linked: true, Username: 'reader' });
    renderWithProviders(<StorytellerLink />);
    await screen.findByTestId('storyteller-connect');
    await fillAndConnect();
    expect(await screen.findByTestId('storyteller-linked')).toHaveTextContent(
      'Connected as reader',
    );
    expect(linkStoryteller).toHaveBeenCalledWith('reader', 'pw');
  });

  it('names bad credentials on a 401', async () => {
    vi.mocked(linkStoryteller).mockRejectedValue(new Unauthenticated());
    renderWithProviders(<StorytellerLink />);
    await screen.findByTestId('storyteller-connect');
    await fillAndConnect();
    expect(await screen.findByTestId('storyteller-error')).toHaveTextContent(
      'Wrong username or password.',
    );
  });

  it('says Storyteller is unreachable on a 502', async () => {
    vi.mocked(linkStoryteller).mockRejectedValue(new HttpError(502));
    renderWithProviders(<StorytellerLink />);
    await screen.findByTestId('storyteller-connect');
    await fillAndConnect();
    expect(await screen.findByTestId('storyteller-error')).toHaveTextContent(/unreachable/);
  });

  it('surfaces a failed link lookup as an error', async () => {
    vi.mocked(getStorytellerLink).mockRejectedValue(new HttpError(500));
    renderWithProviders(<StorytellerLink />);
    expect(await screen.findByTestId('storyteller-error')).toHaveTextContent(/Could not connect/);
  });

  it('surfaces a failed disconnect as an error', async () => {
    vi.mocked(getStorytellerLink).mockResolvedValue({ Linked: true, Username: 'john' });
    vi.mocked(unlinkStoryteller).mockRejectedValue(new HttpError(500));
    renderWithProviders(<StorytellerLink />);
    await userEvent.click(await screen.findByTestId('storyteller-disconnect'));
    expect(await screen.findByTestId('storyteller-error')).toHaveTextContent(/Could not connect/);
  });
});
