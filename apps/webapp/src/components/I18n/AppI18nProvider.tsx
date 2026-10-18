'use client';

import {NextIntlClientProvider, useTranslations} from 'next-intl';
import type {AbstractIntlMessages} from 'next-intl';
import {type PropsWithChildren, useMemo} from 'react';
import {DEFAULT_LOCALE, resolveAppLocale} from '@/i18n/config';
import {getMessagesForLocale} from '@/i18n/messages';
import {createAppTranslator} from '@/i18n/translate';
import {AppTranslationContext} from './AppTranslationContext';

function TranslationBridge({children}: PropsWithChildren) {
  const translator = useTranslations();
  const value = useMemo(() => createAppTranslator(translator), [translator]);
  return <AppTranslationContext.Provider value={value}>{children}</AppTranslationContext.Provider>;
}

export function AppI18nProvider({
  children,
  locale = DEFAULT_LOCALE,
  messages,
}: PropsWithChildren<{locale?: string; messages?: AbstractIntlMessages}>) {
  const appLocale = resolveAppLocale(locale);
  return (
    <NextIntlClientProvider locale={appLocale} messages={messages ?? getMessagesForLocale(appLocale)} timeZone="UTC">
      <TranslationBridge>{children}</TranslationBridge>
    </NextIntlClientProvider>
  );
}
