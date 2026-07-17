import {fireEvent, render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';
import {PreferencesProvider} from '@/preferences/preferences-provider';
import {ThemeProvider} from '@/theme/theme-provider';
import {PreferencesSettings} from './preferences-settings';

describe('PreferencesSettings', () => {
  it('saves locale, currency, time zone, and color mode', () => {
    render(
      <PreferencesProvider>
        <ThemeProvider>
          <PreferencesSettings />
        </ThemeProvider>
      </PreferencesProvider>,
    );
    fireEvent.change(screen.getByLabelText('Locale'), {target: {value: 'de-DE'}});
    fireEvent.change(screen.getByLabelText('Currency'), {target: {value: 'USD'}});
    fireEvent.change(screen.getByLabelText('Time zone'), {target: {value: 'Asia/Tokyo'}});
    fireEvent.change(screen.getByLabelText('Color mode'), {target: {value: 'dark'}});
    fireEvent.click(screen.getByRole('button', {name: 'Save preferences'}));
    expect(screen.getByRole('status')).toHaveTextContent('Preferences saved');
    expect(window.localStorage.getItem('budgetbuddy.preferences')).toContain('Asia/Tokyo');
    expect(document.documentElement).toHaveClass('dark');
  });
});
