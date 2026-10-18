import type {TPreference} from '@budgetbuddyde/api';
import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {usePreferences} from '@/hooks/usePreferences';
import {Preferences} from './Preferences';

const {showSnackbar, updatePreferences, reloadPreferences} = vi.hoisted(() => ({
  showSnackbar: vi.fn(),
  updatePreferences: vi.fn(),
  reloadPreferences: vi.fn(),
}));

vi.mock('@/hooks/usePreferences', () => ({usePreferences: vi.fn()}));
vi.mock('@/hooks/useAppTranslations', () => ({
  useAppTranslations: () => (message: string, values?: Record<string, unknown>) =>
    message.replace(/\{(\w+)\}/g, (placeholder, key: string) => String(values?.[key] ?? placeholder)),
}));
vi.mock('@/components/Snackbar', () => ({useSnackbarContext: () => ({showSnackbar})}));

const preferences: TPreference = {
  ownerId: 'user-1' as TPreference['ownerId'],
  onboardingCompleted: true,
  language: 'en_US',
  currency: 'EUR',
  timeZone: 'Europe/Berlin',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function mockPreferences(overrides: Partial<ReturnType<typeof usePreferences>> = {}) {
  vi.mocked(usePreferences).mockReturnValue({
    preferences,
    effectivePreferences: {language: 'en_US', currency: 'EUR', timeZone: 'Europe/Berlin'},
    locale: 'en-US',
    isLoading: false,
    isSaving: false,
    error: null,
    updatePreferences,
    reloadPreferences,
    ...overrides,
  });
}

function selectUsd() {
  fireEvent.mouseDown(screen.getByRole('combobox', {name: 'Currency'}));
  fireEvent.click(screen.getByRole('option', {name: 'US Dollar (USD)'}));
}

describe('Preferences', () => {
  beforeEach(() => {
    updatePreferences.mockResolvedValue(undefined);
    reloadPreferences.mockResolvedValue(undefined);
    mockPreferences();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('renders saved supported fields read-only until Edit is selected', () => {
    render(<Preferences />);

    expect(screen.getByRole('combobox', {name: 'Language'})).toHaveValue('English (United States)');
    expect(screen.getByRole('combobox', {name: 'Language'})).toHaveAttribute('readonly');
    expect(screen.getByRole('combobox', {name: 'Currency'})).toHaveTextContent('Euro (EUR)');
    expect(screen.getByRole('combobox', {name: 'Currency'})).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('combobox', {name: 'Time zone'})).toHaveValue('Europe/Berlin');
    expect(screen.getByRole('combobox', {name: 'Time zone'})).toHaveAttribute('readonly');

    fireEvent.click(screen.getByRole('button', {name: 'Edit'}));

    expect(screen.getByRole('combobox', {name: 'Language'})).not.toHaveAttribute('readonly');
    expect(screen.getByRole('combobox', {name: 'Currency'})).not.toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('combobox', {name: 'Time zone'})).not.toHaveAttribute('readonly');
    expect(screen.getByRole('button', {name: 'Save changes'})).toBeDisabled();
    expect(screen.getByRole('button', {name: 'Discard'})).toBeEnabled();
    expect(updatePreferences).not.toHaveBeenCalled();
  });

  it('saves only the changed currency and leaves edit mode after success', async () => {
    render(<Preferences />);
    fireEvent.click(screen.getByRole('button', {name: 'Edit'}));
    selectUsd();
    fireEvent.click(screen.getByRole('button', {name: 'Save changes'}));

    await waitFor(() => expect(updatePreferences).toHaveBeenCalledExactlyOnceWith({currency: 'USD'}));
    expect(await screen.findByRole('button', {name: 'Edit'})).toBeInTheDocument();
    expect(showSnackbar).toHaveBeenCalledWith(expect.objectContaining({message: 'Preferences saved.'}));
  });

  it('discards draft changes without saving and restores the saved values on the next edit', () => {
    render(<Preferences />);
    fireEvent.click(screen.getByRole('button', {name: 'Edit'}));
    selectUsd();
    fireEvent.click(screen.getByRole('button', {name: 'Discard'}));

    expect(screen.getByRole('combobox', {name: 'Currency'})).toHaveTextContent('Euro (EUR)');
    fireEvent.click(screen.getByRole('button', {name: 'Edit'}));
    expect(screen.getByRole('button', {name: 'Save changes'})).toBeDisabled();
    expect(updatePreferences).not.toHaveBeenCalled();
    expect(showSnackbar).not.toHaveBeenCalled();
  });

  it('preserves the draft after a failed save and retries from the snackbar action', async () => {
    updatePreferences.mockRejectedValueOnce(new Error('Saving is unavailable'));
    render(<Preferences />);
    fireEvent.click(screen.getByRole('button', {name: 'Edit'}));
    selectUsd();
    fireEvent.click(screen.getByRole('button', {name: 'Save changes'}));

    await waitFor(() =>
      expect(showSnackbar).toHaveBeenCalledWith(
        expect.objectContaining({message: 'Saving is unavailable', action: expect.anything()}),
      ),
    );
    expect(screen.getByRole('combobox', {name: 'Currency'})).toHaveTextContent('US Dollar (USD)');
    expect(screen.getByRole('button', {name: 'Save changes'})).toBeEnabled();
    expect(screen.getByRole('button', {name: 'Discard'})).toBeInTheDocument();

    render(showSnackbar.mock.calls[0][0].action);
    fireEvent.click(screen.getByRole('button', {name: 'Try again'}));

    await waitFor(() => expect(updatePreferences).toHaveBeenCalledTimes(2));
    expect(updatePreferences).toHaveBeenNthCalledWith(1, {currency: 'USD'});
    expect(updatePreferences).toHaveBeenNthCalledWith(2, {currency: 'USD'});
    expect(await screen.findByRole('button', {name: 'Edit'})).toBeInTheDocument();
  });

  it('shows unsupported raw values instead of effective defaults and leaves untouched values out of saves', async () => {
    mockPreferences({preferences: {...preferences, language: 'de_DE', currency: 'GBP', timeZone: 'Europe/London'}});
    render(<Preferences />);

    expect(screen.getByRole('combobox', {name: 'Language'})).toHaveValue('Unsupported (de_DE)');
    expect(screen.getByRole('combobox', {name: 'Currency'})).toHaveTextContent('Unsupported (GBP)');
    expect(screen.getByRole('combobox', {name: 'Time zone'})).toHaveValue('Unsupported (Europe/London)');
    expect(updatePreferences).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', {name: 'Edit'}));
    expect(screen.getByRole('button', {name: 'Save changes'})).toBeDisabled();
    selectUsd();
    fireEvent.click(screen.getByRole('button', {name: 'Save changes'}));

    await waitFor(() => expect(updatePreferences).toHaveBeenCalledExactlyOnceWith({currency: 'USD'}));
    expect(await screen.findByRole('button', {name: 'Edit'})).toBeInTheDocument();
  });

  it('shows loading without editable fields or a save action', () => {
    mockPreferences({preferences: null, isLoading: true});
    render(<Preferences />);

    expect(screen.getByRole('progressbar', {name: 'Loading preferences'})).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', {name: 'Edit'})).not.toBeInTheDocument();
    expect(screen.queryByRole('button', {name: 'Save changes'})).not.toBeInTheDocument();
    expect(updatePreferences).not.toHaveBeenCalled();
  });

  it('surfaces a load failure and lets the user retry loading', async () => {
    mockPreferences({preferences: null, error: 'Connection lost'});
    render(<Preferences />);

    expect(screen.getByText('Preferences could not be loaded: Connection lost')).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name: 'Try again'}));

    await waitFor(() => expect(reloadPreferences).toHaveBeenCalledExactlyOnceWith());
    expect(updatePreferences).not.toHaveBeenCalled();
  });

  it.each([false, true])('resets an editing draft when the owner changes (interim null: %s)', interimNull => {
    const {rerender} = render(<Preferences />);
    fireEvent.click(screen.getByRole('button', {name: 'Edit'}));
    selectUsd();

    if (interimNull) {
      mockPreferences({preferences: null, isLoading: true});
      rerender(<Preferences />);
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', {name: 'Save changes'})).not.toBeInTheDocument();
    }

    mockPreferences({preferences: {...preferences, ownerId: 'user-2' as TPreference['ownerId']}});
    rerender(<Preferences />);

    expect(screen.getByRole('combobox', {name: 'Currency'})).toHaveTextContent('Euro (EUR)');
    expect(screen.getByRole('button', {name: 'Edit'})).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name: 'Edit'}));
    expect(screen.getByRole('button', {name: 'Save changes'})).toBeDisabled();
    expect(updatePreferences).not.toHaveBeenCalled();
  });

  it('invalidates retained retry actions on owner changes, including returning to the original owner', async () => {
    updatePreferences.mockRejectedValueOnce(new Error('Saving is unavailable'));
    const {rerender} = render(<Preferences />);
    fireEvent.click(screen.getByRole('button', {name: 'Edit'}));
    selectUsd();
    fireEvent.click(screen.getByRole('button', {name: 'Save changes'}));
    await waitFor(() => expect(showSnackbar).toHaveBeenCalledTimes(1));
    render(showSnackbar.mock.calls[0][0].action);

    mockPreferences({preferences: null, isLoading: true});
    rerender(<Preferences />);
    fireEvent.click(screen.getByRole('button', {name: 'Try again'}));

    mockPreferences({preferences: {...preferences, ownerId: 'user-2' as TPreference['ownerId']}});
    rerender(<Preferences />);
    fireEvent.click(screen.getByRole('button', {name: 'Try again'}));

    mockPreferences();
    rerender(<Preferences />);
    fireEvent.click(screen.getByRole('button', {name: 'Try again'}));

    expect(updatePreferences).toHaveBeenCalledExactlyOnceWith({currency: 'USD'});
    expect(showSnackbar).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('combobox', {name: 'Currency'})).toHaveTextContent('Euro (EUR)');
    expect(screen.getByRole('button', {name: 'Edit'})).toBeInTheDocument();
  });
});
