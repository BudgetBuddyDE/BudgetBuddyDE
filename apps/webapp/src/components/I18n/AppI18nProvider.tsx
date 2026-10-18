'use client';

import {NextIntlClientProvider, useTranslations} from 'next-intl';
import {type PropsWithChildren, useMemo} from 'react';
import {DEFAULT_LOCALE, resolveAppLocale} from '@/lib/i18n/config';
import {createAppTranslator} from '@/lib/i18n/translate';
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
}: PropsWithChildren<{locale?: string; messages: Record<string, string>}>) {
  return (
    <NextIntlClientProvider locale={resolveAppLocale(locale)} messages={messages} timeZone="UTC">
      <TranslationBridge>{children}</TranslationBridge>
    </NextIntlClientProvider>
  );
}
