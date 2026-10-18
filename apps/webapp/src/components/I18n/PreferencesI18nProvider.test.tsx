import {cleanup, render, screen} from '@testing-library/react';
import {renderToString} from 'react-dom/server';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {useAppTranslations} from '@/hooks/useAppTranslations';
import {getMessagesForLocale} from '@/i18n/messages';
import {AppI18nProvider} from './AppI18nProvider';
import {PreferencesI18nProvider} from './PreferencesI18nProvider';

const preferences = vi.hoisted(() => ({locale: undefined as string | undefined}));
vi.mock('@/hooks/usePreferences', () => ({usePreferences: () => preferences}));

function Message() {
  const t = useAppTranslations();
  return <p>{t('errors.oops')}</p>;
}

function NestedProviders() {
  return (
    <AppI18nProvider locale="de-DE" messages={getMessagesForLocale('de-DE')}>
      <PreferencesI18nProvider initialLanguage="de_DE">
        <Message />
      </PreferencesI18nProvider>
    </AppI18nProvider>
  );
}

beforeEach(() => {
  preferences.locale = undefined;
  document.documentElement.lang = 'en-US';
});

afterEach(() => {
  cleanup();
  document.documentElement.lang = 'en-US';
});

describe('PreferencesI18nProvider', () => {
  it.each([undefined, 'de-DE'])('keeps nested German server rendering with preference locale %s', locale => {
    preferences.locale = locale;
    expect(renderToString(<NestedProviders />)).toBe('<p>Hoppla!</p>');
  });

  it('immediately follows preference locale changes rather than the outer catalog', () => {
    preferences.locale = 'en-US';
    const {rerender} = render(<NestedProviders />);
    expect(screen.getByText('Ooops!')).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('en-US');

    preferences.locale = 'de-DE';
    rerender(<NestedProviders />);
    expect(screen.getByText('Hoppla!')).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('de-DE');

    preferences.locale = 'en-US';
    rerender(<NestedProviders />);
    expect(screen.getByText('Ooops!')).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('en-US');
  });

  it('does not reset the document language when a German preferences provider unmounts', () => {
    preferences.locale = 'de-DE';
    const {unmount} = render(<NestedProviders />);
    expect(document.documentElement.lang).toBe('de-DE');

    unmount();

    expect(document.documentElement.lang).toBe('de-DE');
  });

  it('does not overwrite the next route language during provider cleanup', () => {
    preferences.locale = 'en-US';
    const {unmount} = render(<NestedProviders />);
    expect(document.documentElement.lang).toBe('en-US');
    document.documentElement.lang = 'de-DE';

    unmount();

    expect(document.documentElement.lang).toBe('de-DE');
  });
});
