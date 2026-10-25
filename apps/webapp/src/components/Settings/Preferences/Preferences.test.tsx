import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {NextIntlClientProvider} from 'next-intl';
import {describe, expect, it, vi} from 'vite-plus/test';
import messages from '@/messages/en-US.json';
import {Preferences} from './Preferences';

const {get, update} = vi.hoisted(() => ({get: vi.fn(), update: vi.fn()}));

vi.mock('@/apiClient', () => ({apiClient: {backend: {preference: {get, update}}}}));
vi.mock('next/navigation', () => ({useRouter: () => ({refresh: vi.fn()})}));

describe('Preferences', () => {
  it('loads current values and saves selected preferences', async () => {
    update.mockReset();
    get.mockResolvedValueOnce([{data: {language: 'en_US', currency: 'EUR'}}, null]);
    update.mockResolvedValueOnce([{data: {language: 'en_US', currency: 'EUR'}}, null]);
    render(
      <NextIntlClientProvider locale="en-US" messages={messages}>
        <Preferences />
      </NextIntlClientProvider>,
    );

    await waitFor(() => expect(screen.getByLabelText('Language')).toBeInTheDocument());
    expect(screen.getByRole('button', {name: 'Save preferences'})).toBeEnabled();
    fireEvent.click(screen.getByRole('button', {name: 'Save preferences'}));

    await waitFor(() => expect(update).toHaveBeenCalledWith({language: 'en_US', currency: 'EUR'}));
    expect(await screen.findByText('Preferences saved.')).toBeInTheDocument();
  });

  it('offers retry when preferences fail to load', async () => {
    update.mockReset().mockResolvedValueOnce([{data: {language: 'en_US', currency: 'USD'}}, null]);
    get
      .mockResolvedValueOnce([null, new Error('offline')])
      .mockResolvedValueOnce([{data: {language: 'en_US', currency: 'USD'}}, null]);
    render(
      <NextIntlClientProvider locale="en-US" messages={messages}>
        <Preferences />
      </NextIntlClientProvider>,
    );

    fireEvent.click(await screen.findByRole('button', {name: 'Retry'}));
    await waitFor(() => expect(screen.getByLabelText('Currency')).toBeInTheDocument());
    expect(screen.getByRole('button', {name: 'Save preferences'})).toBeEnabled();
    fireEvent.click(screen.getByRole('button', {name: 'Save preferences'}));
    await waitFor(() => expect(update).toHaveBeenCalledWith({language: 'en_US', currency: 'USD'}));
    expect(get).toHaveBeenCalledTimes(2);
  });

  it('does not save fallback values when loading preferences fails', async () => {
    get.mockResolvedValueOnce([null, new Error('offline')]);
    render(
      <NextIntlClientProvider locale="en-US" messages={messages}>
        <Preferences />
      </NextIntlClientProvider>,
    );

    expect(await screen.findByText('Could not load preferences. Please try again.')).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Save preferences'})).toBeDisabled();
    expect(update).not.toHaveBeenCalled();
  });

  it('shows an error and keeps the confirmed values when saving fails', async () => {
    get.mockResolvedValueOnce([{data: {language: 'en_US', currency: 'EUR'}}, null]);
    update.mockReset().mockResolvedValueOnce([null, new Error('offline')]);
    render(
      <NextIntlClientProvider locale="en-US" messages={messages}>
        <Preferences />
      </NextIntlClientProvider>,
    );

    fireEvent.click(await screen.findByRole('button', {name: 'Save preferences'}));
    expect(await screen.findByText('Could not save preferences. Please try again.')).toBeInTheDocument();
    expect(screen.queryByText('Preferences saved.')).not.toBeInTheDocument();
  });
});
