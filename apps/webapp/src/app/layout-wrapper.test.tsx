import {cleanup, render, screen} from '@testing-library/react';
import type {PropsWithChildren} from 'react';
import {renderToString} from 'react-dom/server';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {PreferencesI18nProvider} from '@/components/I18n/PreferencesI18nProvider';
import {useAppTranslations} from '@/hooks/useAppTranslations';
import {getMessagesForLocale} from '@/i18n/messages';
import {LayoutWrapper} from './layout-wrapper';

const navigation = vi.hoisted(() => ({segments: ['(auth)', 'sign-in']}));
const preferences = vi.hoisted(() => ({locale: undefined as string | undefined}));

vi.mock('next/navigation', () => ({useSelectedLayoutSegments: () => navigation.segments}));
vi.mock('@/hooks/usePreferences', () => ({usePreferences: () => preferences}));
vi.mock('@mui/material', () => ({
  CssBaseline: () => null,
  InitColorSchemeScript: () => null,
  ThemeProvider: ({children}: PropsWithChildren) => children,
}));
vi.mock('@mui/material-nextjs/v16-appRouter', () => ({
  AppRouterCacheProvider: ({children}: PropsWithChildren) => children,
}));
vi.mock('@/components/Snackbar', () => ({SnackbarProvider: ({children}: PropsWithChildren) => children}));
vi.mock('@/theme/AppTheme', () => ({AppTheme: {}}));

function Message() {
  const t = useAppTranslations();
  return <p>{t('auth.signIn.signIn')}</p>;
}

function RoutedLayout({locale, browserLocale}: {locale: string; browserLocale: string}) {
  return (
    <LayoutWrapper locale={locale} browserLocale={browserLocale} messages={getMessagesForLocale(locale)}>
      {navigation.segments.includes('(dashboard)') ? (
        <PreferencesI18nProvider>
          <Message />
        </PreferencesI18nProvider>
      ) : (
        <Message />
      )}
    </LayoutWrapper>
  );
}

beforeEach(() => {
  navigation.segments = ['(auth)', 'sign-in'];
  preferences.locale = undefined;
  document.documentElement.lang = 'en-US';
});

afterEach(() => {
  cleanup();
  document.documentElement.lang = 'en-US';
});

describe('LayoutWrapper locale selection', () => {
  it('renders German auth on the first server render despite an English account catalog', () => {
    const html = renderToString(<RoutedLayout locale="en-US" browserLocale="de-DE" />);

    expect(html).toBe('<p>Anmelden</p>');
    expect(html).not.toContain('Sign in');
  });

  it('renders English auth for an English browser despite a German account catalog', () => {
    expect(renderToString(<RoutedLayout locale="de-DE" browserLocale="en-US" />)).toBe('<p>Sign in</p>');
  });

  it.each([{segments: []}, {segments: ['legal']}, {segments: ['(public)', 'privacy']}])(
    'keeps public route segments $segments in English',
    ({segments}) => {
      navigation.segments = segments;

      expect(renderToString(<RoutedLayout locale="de-DE" browserLocale="de-DE" />)).toBe('<p>Sign in</p>');
      render(<RoutedLayout locale="de-DE" browserLocale="de-DE" />);
      expect(document.documentElement.lang).toBe('en-US');
    },
  );

  it('preserves the account locale for dashboard server rendering', () => {
    navigation.segments = ['(dashboard)', 'transactions'];
    preferences.locale = 'de-DE';

    expect(renderToString(<RoutedLayout locale="de-DE" browserLocale="en-US" />)).toBe('<p>Anmelden</p>');
  });

  it.each([
    {accountLocale: 'de-DE', browserLocale: 'en-US', accountMessage: 'Anmelden', browserMessage: 'Sign in'},
    {accountLocale: 'en-US', browserLocale: 'de-DE', accountMessage: 'Sign in', browserMessage: 'Anmelden'},
  ])(
    'switches from the $accountLocale dashboard to $browserLocale auth without retaining account language',
    ({accountLocale, browserLocale, accountMessage, browserMessage}) => {
      navigation.segments = ['(dashboard)', 'transactions'];
      preferences.locale = accountLocale;
      const {rerender} = render(<RoutedLayout locale={accountLocale} browserLocale={browserLocale} />);
      expect(screen.getByText(accountMessage)).toBeInTheDocument();
      expect(document.documentElement.lang).toBe(accountLocale);

      navigation.segments = ['(auth)', 'sign-in'];
      rerender(<RoutedLayout locale={accountLocale} browserLocale={browserLocale} />);
      expect(screen.getByText(browserMessage)).toBeInTheDocument();
      expect(screen.queryByText(accountMessage)).not.toBeInTheDocument();
      expect(document.documentElement.lang).toBe(browserLocale);

      navigation.segments = ['(dashboard)', 'transactions'];
      rerender(<RoutedLayout locale={accountLocale} browserLocale={browserLocale} />);
      expect(screen.getByText(accountMessage)).toBeInTheDocument();
      expect(document.documentElement.lang).toBe(accountLocale);
    },
  );

  it('lets the loaded account preference control dashboard HTML language rather than the root locale', () => {
    navigation.segments = ['(dashboard)', 'settings'];
    preferences.locale = 'de-DE';

    render(<RoutedLayout locale="en-US" browserLocale="en-US" />);

    expect(screen.getByText('Anmelden')).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('de-DE');
  });

  it('resets a German dashboard to English when navigating to a public route', () => {
    navigation.segments = ['(dashboard)', 'transactions'];
    preferences.locale = 'de-DE';
    const {rerender} = render(<RoutedLayout locale="de-DE" browserLocale="de-DE" />);
    expect(document.documentElement.lang).toBe('de-DE');

    navigation.segments = ['legal'];
    rerender(<RoutedLayout locale="de-DE" browserLocale="de-DE" />);

    expect(screen.getByText('Sign in')).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('en-US');
  });
});
