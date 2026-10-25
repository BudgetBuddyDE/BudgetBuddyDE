'use client';

import {CssBaseline, InitColorSchemeScript, ThemeProvider} from '@mui/material';
import {enUS as materialEnUS} from '@mui/material/locale';
import {createTheme} from '@mui/material/styles';
import {AppRouterCacheProvider} from '@mui/material-nextjs/v16-appRouter';
import {enUS as dataGridEnUS} from '@mui/x-data-grid/locales';
import {enUS as datePickerEnUS} from '@mui/x-date-pickers/locales';
import {NextIntlClientProvider} from 'next-intl';
import React, {useMemo, useState} from 'react';
import {SnackbarProvider} from '@/components/Snackbar';
import {AppTheme} from '@/theme/AppTheme';
import {CurrencyContext, LocaleContext} from '@/utils/Formatter/PreferenceContext';

export const LayoutWrapper: React.FC<
  React.PropsWithChildren<{locale?: string; messages?: Record<string, unknown>; currency?: 'EUR' | 'USD'}>
> = ({children, locale, messages, currency = 'EUR'}) => {
  const localizedTheme = React.useMemo(() => createTheme(AppTheme, materialEnUS, dataGridEnUS, datePickerEnUS), []);
  const [activeCurrency, setActiveCurrency] = useState(currency);
  const currencyValue = useMemo(() => activeCurrency, [activeCurrency]);
  React.useEffect(() => {
    document.documentElement.dataset.currency = activeCurrency;
  }, [activeCurrency]);
  React.useEffect(() => {
    const handleCurrencyChange = (event: Event) => {
      const nextCurrency = (event as CustomEvent<'EUR' | 'USD'>).detail;
      if (nextCurrency === 'EUR' || nextCurrency === 'USD') setActiveCurrency(nextCurrency);
    };
    window.addEventListener('budgetbuddy-currency-change', handleCurrencyChange);
    return () => window.removeEventListener('budgetbuddy-currency-change', handleCurrencyChange);
  }, []);
  return (
    <React.Fragment>
      <InitColorSchemeScript attribute="class" />
      <AppRouterCacheProvider options={{enableCssLayer: true}}>
        <ThemeProvider theme={localizedTheme}>
          {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
          <CssBaseline />
          <SnackbarProvider>
            <NextIntlClientProvider locale={locale ?? 'en-US'} messages={messages ?? {}} timeZone="UTC">
              <LocaleContext.Provider value={locale ?? 'en-US'}>
                <CurrencyContext.Provider value={currencyValue}>{children}</CurrencyContext.Provider>
              </LocaleContext.Provider>
            </NextIntlClientProvider>
          </SnackbarProvider>
        </ThemeProvider>
      </AppRouterCacheProvider>
    </React.Fragment>
  );
};
