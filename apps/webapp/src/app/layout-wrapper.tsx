'use client';

import {CssBaseline, InitColorSchemeScript, ThemeProvider} from '@mui/material';
import {AppRouterCacheProvider} from '@mui/material-nextjs/v16-appRouter';
import {useSelectedLayoutSegments} from 'next/navigation';
import React from 'react';
import {AppI18nProvider} from '@/components/I18n/AppI18nProvider';
import {SnackbarProvider} from '@/components/Snackbar';
import {DEFAULT_LOCALE} from '@/i18n/config';
import {AppTheme} from '@/theme/AppTheme';

export const LayoutWrapper: React.FC<React.PropsWithChildren<{locale?: string; messages?: unknown}>> = ({
  children,
  locale = DEFAULT_LOCALE,
  messages,
}) => {
  // Root layouts survive navigation: never carry a dashboard locale into public UI.
  const segments = useSelectedLayoutSegments();
  const activeLocale = segments.includes('(dashboard)') ? locale : DEFAULT_LOCALE;
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
