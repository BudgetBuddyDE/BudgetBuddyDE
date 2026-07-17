import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {beforeEach, describe, expect, it} from 'vitest';
import {PreferencesProvider, usePreferences} from './preferences-provider';

function Consumer() {
  const {preferences, setPreferences} = usePreferences();
  return (
    <button onClick={() => setPreferences({...preferences, locale: 'de-DE', currency: 'USD'})}>
      {preferences.locale}:{preferences.currency}
    </button>
  );
}

describe('PreferencesProvider', () => {
  beforeEach(() => window.localStorage.clear());
  it('persists regional settings and updates the document locale', async () => {
    render(
      <PreferencesProvider>
        <Consumer />
      </PreferencesProvider>,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('button')).toHaveTextContent('de-DE:USD');
    expect(JSON.parse(window.localStorage.getItem('budgetbuddy.preferences') ?? '{}')).toMatchObject({
      locale: 'de-DE',
      currency: 'USD',
    });
    await waitFor(() => expect(document.documentElement.lang).toBe('de-DE'));
  });
  it('rejects consumers outside the provider', () => {
    expect(() => render(<Consumer />)).toThrow('usePreferences must be used within PreferencesProvider');
  });
});
