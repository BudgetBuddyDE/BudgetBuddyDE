'use client';

import {NextIntlClientProvider, useTranslations} from 'next-intl';
import type {AbstractIntlMessages} from 'next-intl';
import {type PropsWithChildren, useEffect, useMemo, useState} from 'react';
import {DEFAULT_LOCALE, resolveAppLocale} from '@/i18n/config';
import {englishMessages, getMessagesForLocale} from '@/i18n/messages';
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
}: PropsWithChildren<{locale?: string; messages?: unknown}>) {
  const appLocale = resolveAppLocale(locale);
  const [loaded, setLoaded] = useState<{locale: string; messages: unknown}>({
    locale: appLocale,
    messages: messages ?? englishMessages,
  });
  useEffect(() => {
    let active = true;
    if (messages) return;
    void getMessagesForLocale(appLocale).then(value => {
      if (active) setLoaded({locale: appLocale, messages: value});
    });
    return () => {
      active = false;
    };
  }, [appLocale, messages]);
  return (
    <NextIntlClientProvider
      locale={appLocale}
      messages={(messages ?? (loaded.locale === appLocale ? loaded.messages : englishMessages)) as AbstractIntlMessages}
      timeZone="UTC"
    >
      <TranslationBridge>{children}</TranslationBridge>
    </NextIntlClientProvider>
  );
}
