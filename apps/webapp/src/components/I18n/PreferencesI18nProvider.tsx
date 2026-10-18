'use client';

import type {PropsWithChildren} from 'react';
import {usePreferences} from '@/hooks/usePreferences';
import {resolveAppLocale} from '@/lib/i18n/config';
import {AppI18nProvider} from './AppI18nProvider';

export function PreferencesI18nProvider({
  children,
  initialLanguage,
  messages,
}: PropsWithChildren<{initialLanguage?: string; messages: Record<string, string>}>) {
  const {locale} = usePreferences();
  return (
    <AppI18nProvider locale={resolveAppLocale(locale ?? initialLanguage)} messages={messages}>
      {children}
    </AppI18nProvider>
  );
}
