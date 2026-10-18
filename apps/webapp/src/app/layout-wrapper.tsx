'use client';

import {CssBaseline, InitColorSchemeScript, ThemeProvider} from '@mui/material';
import {AppRouterCacheProvider} from '@mui/material-nextjs/v16-appRouter';
import {useSelectedLayoutSegments} from 'next/navigation';
import type {AbstractIntlMessages} from 'next-intl';
import React from 'react';
import {AppI18nProvider} from '@/components/I18n/AppI18nProvider';
import {SnackbarProvider} from '@/components/Snackbar';
import {DEFAULT_LOCALE} from '@/i18n/config';
import {AppTheme} from '@/theme/AppTheme';

export const LayoutWrapper: React.FC<
  React.PropsWithChildren<{locale?: string; browserLocale?: string; messages?: AbstractIntlMessages}>
> = ({children, locale = DEFAULT_LOCALE, browserLocale = DEFAULT_LOCALE, messages}) => {
  // Root layouts survive navigation; auth pages use the browser, not the previous account's language.
  const segments = useSelectedLayoutSegments();
  const isDashboard = segments.includes('(dashboard)');
  const activeLocale = isDashboard ? locale : segments.includes('(auth)') ? browserLocale : DEFAULT_LOCALE;
  React.useEffect(() => {
    if (!isDashboard) document.documentElement.lang = activeLocale;
  }, [activeLocale, isDashboard]);
  return (
    <React.Fragment>
      <InitColorSchemeScript attribute="class" />
      <AppRouterCacheProvider options={{enableCssLayer: true}}>
        <ThemeProvider theme={AppTheme}>
          {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
          <CssBaseline />
          <AppI18nProvider locale={activeLocale} messages={activeLocale === locale ? messages : undefined}>
            <SnackbarProvider>{children}</SnackbarProvider>
          </AppI18nProvider>
        </ThemeProvider>
      </AppRouterCacheProvider>
    </React.Fragment>
  );
};
