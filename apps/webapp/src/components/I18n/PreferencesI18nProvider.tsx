'use client';

import {type PropsWithChildren, useEffect} from 'react';
import {usePreferences} from '@/hooks/usePreferences';
import {resolveAppLocale} from '@/i18n/config';
import {AppI18nProvider} from './AppI18nProvider';

export function PreferencesI18nProvider({children, initialLanguage}: PropsWithChildren<{initialLanguage?: string}>) {
  const {locale} = usePreferences();
  const appLocale = resolveAppLocale(locale ?? initialLanguage);

  useEffect(() => {
    document.documentElement.lang = appLocale;
  }, [appLocale]);

  return <AppI18nProvider locale={appLocale}>{children}</AppI18nProvider>;
}
