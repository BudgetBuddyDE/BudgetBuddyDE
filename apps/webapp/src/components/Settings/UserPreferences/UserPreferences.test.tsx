import {NextIntlClientProvider} from 'next-intl';
import {describe, expect, it, vi} from 'vite-plus/test';
import messages from '@/i18n/messages/en-US.json';
import {fireEvent, render, screen, waitFor} from '@/test/testing-library';
import {UserPreferences} from './UserPreferences';

const {get, update, showSnackbar} = vi.hoisted(() => ({get: vi.fn(), update: vi.fn(), showSnackbar: vi.fn()}));

vi.mock('@/apiClient', () => ({apiClient: {backend: {preference: {get, update}}}}));
vi.mock('next/navigation', () => ({useRouter: () => ({refresh: vi.fn()})}));
vi.mock('@/components/Snackbar', () => ({useSnackbarContext: () => ({showSnackbar})}));

describe('UserPreferences', () => {
  it('keeps values read-only until edit is enabled, then saves them', async () => {
    update.mockReset();
    get.mockResolvedValueOnce([{data: {language: 'en_US', currency: 'EUR'}}, null]);
    update.mockResolvedValueOnce([{data: {language: 'en_US', currency: 'EUR'}}, null]);
    render(
      <NextIntlClientProvider locale="en-US" messages={messages}>
        <UserPreferences />
      </NextIntlClientProvider>,
    );

    await waitFor(() => expect(screen.getByLabelText('Language')).toBeInTheDocument());
    expect(screen.getByLabelText('Language')).toBeDisabled();
    expect(screen.getByLabelText('Currency')).toBeDisabled();
    fireEvent.click(screen.getByRole('button', {name: 'Edit'}));
    expect(screen.getByLabelText('Language')).toBeEnabled();
    expect(screen.getByLabelText('Currency')).toBeEnabled();
    expect(screen.getByRole('button', {name: 'Save preferences'})).toBeEnabled();
    fireEvent.click(screen.getByRole('button', {name: 'Save preferences'}));

    await waitFor(() => expect(update).toHaveBeenCalledWith({language: 'en_US', currency: 'EUR'}));
    expect(showSnackbar).toHaveBeenCalledWith({message: 'Preferences saved.'});
  });

  it('offers retry when preferences fail to load', async () => {
    update.mockReset().mockResolvedValueOnce([{data: {language: 'en_US', currency: 'USD'}}, null]);
    get
      .mockResolvedValueOnce([null, new Error('offline')])
      .mockResolvedValueOnce([{data: {language: 'en_US', currency: 'USD'}}, null]);
    render(
      <NextIntlClientProvider locale="en-US" messages={messages}>
        <UserPreferences />
      </NextIntlClientProvider>,
    );

    fireEvent.click(await screen.findByRole('button', {name: 'Retry'}));
    await waitFor(() => expect(screen.getByLabelText('Currency')).toBeInTheDocument());
    expect(screen.getByRole('button', {name: 'Edit'})).toBeEnabled();
    fireEvent.click(screen.getByRole('button', {name: 'Edit'}));
    fireEvent.click(screen.getByRole('button', {name: 'Save preferences'}));
    await waitFor(() => expect(update).toHaveBeenCalledWith({language: 'en_US', currency: 'USD'}));
    expect(get).toHaveBeenCalledTimes(2);
  });

  it('does not save fallback values when loading preferences fails', async () => {
    get.mockResolvedValueOnce([null, new Error('offline')]);
    render(
      <NextIntlClientProvider locale="en-US" messages={messages}>
        <UserPreferences />
      </NextIntlClientProvider>,
    );

    expect(await screen.findByText('Could not load preferences. Please try again.')).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Edit'})).toBeDisabled();
    expect(update).not.toHaveBeenCalled();
  });

  it('shows an error and keeps the confirmed values when saving fails', async () => {
    get.mockResolvedValueOnce([{data: {language: 'en_US', currency: 'EUR'}}, null]);
    update.mockReset().mockResolvedValueOnce([null, new Error('offline')]);
    render(
      <NextIntlClientProvider locale="en-US" messages={messages}>
        <UserPreferences />
      </NextIntlClientProvider>,
    );

    fireEvent.click(await screen.findByRole('button', {name: 'Edit'}));
    fireEvent.click(screen.getByRole('button', {name: 'Save preferences'}));
    expect(await screen.findByText('Could not save preferences. Please try again.')).toBeInTheDocument();
    expect(screen.queryByText('Preferences saved.')).not.toBeInTheDocument();
    expect(showSnackbar).not.toHaveBeenCalledWith({message: 'Preferences saved.'});
    expect(screen.getByRole('button', {name: 'Save preferences'})).toBeEnabled();
  });

  it('allows retrying after the save request rejects', async () => {
    get.mockResolvedValueOnce([{data: {language: 'en_US', currency: 'EUR'}}, null]);
    update.mockReset().mockRejectedValueOnce(new Error('offline'));
    render(
      <NextIntlClientProvider locale="en-US" messages={messages}>
        <UserPreferences />
      </NextIntlClientProvider>,
    );

    fireEvent.click(await screen.findByRole('button', {name: 'Edit'}));
    fireEvent.click(screen.getByRole('button', {name: 'Save preferences'}));
    expect(await screen.findByText('Could not save preferences. Please try again.')).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Save preferences'})).toBeEnabled();
  });

  it('saves the German preference locale using the API locale format', async () => {
    get.mockResolvedValueOnce([{data: {language: 'en_US', currency: 'EUR'}}, null]);
    update.mockReset().mockResolvedValueOnce([{data: {language: 'de_DE', currency: 'EUR'}}, null]);
    render(
      <NextIntlClientProvider locale="en-US" messages={messages}>
        <UserPreferences />
      </NextIntlClientProvider>,
    );

    fireEvent.click(await screen.findByRole('button', {name: 'Edit'}));
    fireEvent.click(screen.getByLabelText('Language'));
    fireEvent.change(screen.getByLabelText('Language'), {target: {value: 'German'}});
    fireEvent.click(await screen.findByRole('option', {name: 'German (Germany)'}));
    fireEvent.click(screen.getByRole('button', {name: 'Save preferences'}));

    await waitFor(() => expect(update).toHaveBeenCalledWith({language: 'de_DE', currency: 'EUR'}));
    expect(showSnackbar).toHaveBeenCalledWith({message: 'Preferences saved.'});
  });

  it('discards edits locally without saving', async () => {
    get.mockResolvedValueOnce([{data: {language: 'en_US', currency: 'EUR'}}, null]);
    update.mockReset();
    render(
      <NextIntlClientProvider locale="en-US" messages={messages}>
        <UserPreferences />
      </NextIntlClientProvider>,
    );

    await screen.findByRole('button', {name: 'Edit'});
    fireEvent.click(screen.getByRole('button', {name: 'Edit'}));
    fireEvent.click(screen.getByLabelText('Currency'));
    fireEvent.change(screen.getByLabelText('Currency'), {target: {value: 'US'}});
    fireEvent.click(await screen.findByRole('option', {name: 'US dollar (USD)'}));
    fireEvent.click(screen.getByRole('button', {name: 'Discard'}));

    expect(screen.getByLabelText('Currency')).toHaveValue('Euro (EUR)');
    expect(screen.getByRole('button', {name: 'Edit'})).toBeInTheDocument();
    expect(update).not.toHaveBeenCalled();
    expect(showSnackbar).toHaveBeenCalledWith({message: 'Preference changes were discarded.'});
  });
});
