import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {afterEach, describe, expect, it} from 'vitest';
import {I18nProvider, registerCatalog, useI18n} from './i18n';

registerCatalog('en', {greeting: 'Hello {name}', amount: 'Amount'});
registerCatalog('de', {greeting: 'Hallo {name}', amount: 'Betrag'});

function Harness() {
  const {locale, setLocale, t, formatCurrency, formatDate} = useI18n();
  return (
    <>
      <p>{t('greeting', {name: 'Alex'})}</p>
      <output>{formatCurrency(1234.5)}</output>
      <time>{formatDate(new Date('2026-07-16T12:00:00Z'))}</time>
      <button onClick={() => setLocale(locale === 'de-DE' ? 'en-DE' : 'de-DE')}>{t('amount')}</button>
    </>
  );
}

describe('I18nProvider', () => {
  afterEach(() => window.localStorage.clear());

  it('restores the locale and updates text and locale-sensitive formatting', async () => {
    window.localStorage.setItem('budgetbuddy-locale', 'de-DE');
    render(
      <I18nProvider>
        <Harness />
      </I18nProvider>,
    );
    await waitFor(() => expect(screen.getByText('Hallo Alex')).toBeVisible());
    expect(screen.getByText('Betrag')).toBeVisible();
    expect(screen.getByRole('status')).toHaveTextContent(/1\.234,50\s€/);
    expect(screen.getByText(/16\. Juli 2026/)).toBeVisible();

    await userEvent.click(screen.getByRole('button', {name: 'Betrag'}));
    expect(screen.getByText('Hello Alex')).toBeVisible();
    expect(document.documentElement.lang).toBe('en');
  });

  it('uses the centralized development fallback for an unknown key', () => {
    function Missing() {
      return <p>{useI18n().t('unknown.key')}</p>;
    }
    render(
      <I18nProvider>
        <Missing />
      </I18nProvider>,
    );
    expect(screen.getByText('[missing translation: unknown.key]')).toBeVisible();
  });
});
