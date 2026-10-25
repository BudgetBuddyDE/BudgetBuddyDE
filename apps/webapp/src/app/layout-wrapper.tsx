'use client';

import {CssBaseline, InitColorSchemeScript, ThemeProvider} from '@mui/material';
import {deDE as materialDeDE, enUS as materialEnUS} from '@mui/material/locale';
import {createTheme} from '@mui/material/styles';
import {AppRouterCacheProvider} from '@mui/material-nextjs/v16-appRouter';
import {deDE as dataGridDeDE, enUS as dataGridEnUS} from '@mui/x-data-grid/locales';
import {deDE as datePickerDeDE, enUS as datePickerEnUS} from '@mui/x-date-pickers/locales';
import {NextIntlClientProvider} from 'next-intl';
import React, {useMemo, useState} from 'react';
import {SnackbarProvider} from '@/components/Snackbar';
import {AppTheme} from '@/theme/AppTheme';
import {CurrencyContext, LocaleContext} from '@/utils/Formatter/PreferenceContext';

export const LayoutWrapper: React.FC<
  React.PropsWithChildren<{locale?: string; messages?: Record<string, unknown>; currency?: 'EUR' | 'USD'}>
> = ({children, locale, messages, currency = 'EUR'}) => {
  const [activeLocale, setActiveLocale] = useState(locale ?? 'en-US');
  const localizedTheme = React.useMemo(
    () =>
      activeLocale === 'de-DE'
        ? createTheme(AppTheme, materialDeDE, dataGridDeDE, datePickerDeDE)
        : createTheme(AppTheme, materialEnUS, dataGridEnUS, datePickerEnUS),
    [activeLocale],
  );
  const [activeCurrency, setActiveCurrency] = useState(currency);
  const currencyValue = useMemo(() => activeCurrency, [activeCurrency]);
  React.useEffect(() => {
    document.documentElement.dataset.currency = activeCurrency;
  }, [activeCurrency]);
  React.useEffect(() => {
    setActiveLocale(locale ?? 'en-US');
  }, [locale]);
  React.useEffect(() => {
    const handleLocaleChange = (event: Event) => {
      const nextLocale = (event as CustomEvent<'en-US' | 'de-DE'>).detail;
      if (nextLocale === 'en-US' || nextLocale === 'de-DE') setActiveLocale(nextLocale);
    };
    window.addEventListener('budgetbuddy-locale-change', handleLocaleChange);
    return () => window.removeEventListener('budgetbuddy-locale-change', handleLocaleChange);
  }, []);
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
            <NextIntlClientProvider locale={activeLocale} messages={messages ?? {}} timeZone="UTC">
              <LocaleContext.Provider value={activeLocale}>
                <CurrencyContext.Provider value={currencyValue}>{children}</CurrencyContext.Provider>
              </LocaleContext.Provider>
            </NextIntlClientProvider>
          </SnackbarProvider>
        </ThemeProvider>
      </AppRouterCacheProvider>
    </React.Fragment>
  );
};
