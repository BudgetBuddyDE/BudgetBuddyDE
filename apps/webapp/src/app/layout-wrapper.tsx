'use client';

import {CssBaseline, InitColorSchemeScript, ThemeProvider} from '@mui/material';
import {AppRouterCacheProvider} from '@mui/material-nextjs/v16-appRouter';
import React from 'react';
import {AppI18nProvider} from '@/components/I18n/AppI18nProvider';
import {SnackbarProvider} from '@/components/Snackbar';
import {englishMessages} from '@/lib/i18n/messages';
import {AppTheme} from '@/theme/AppTheme';

export const LayoutWrapper: React.FC<React.PropsWithChildren<{messages?: Record<string, string>}>> = ({
  children,
  messages = englishMessages,
}) => {
  return (
    <React.Fragment>
      <InitColorSchemeScript attribute="class" />
      <AppRouterCacheProvider options={{enableCssLayer: true}}>
        <ThemeProvider theme={AppTheme}>
          {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
          <CssBaseline />
          <AppI18nProvider messages={messages}>
            <SnackbarProvider>{children}</SnackbarProvider>
          </AppI18nProvider>
        </ThemeProvider>
      </AppRouterCacheProvider>
    </React.Fragment>
  );
};
