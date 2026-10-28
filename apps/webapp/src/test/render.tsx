import {render as testingLibraryRender, type RenderOptions} from '@testing-library/react';
import {NextIntlClientProvider} from 'next-intl';
import React, {type ReactNode} from 'react';
import deMessages from '@/i18n/messages/de-DE.json';
import enMessages from '@/i18n/messages/en-US.json';
import {CurrencyContext, LocaleContext} from '@/utils/Formatter/PreferenceContext';

export function renderWithLocale(ui: ReactNode, locale: 'en-US' | 'de-DE' = 'en-US', options?: RenderOptions) {
  document.documentElement.lang = locale;
  const messages = locale === 'de-DE' ? deMessages : enMessages;
  const wrap = (children: ReactNode) => (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="UTC">
      <LocaleContext.Provider value={locale}>
        <CurrencyContext.Provider value="EUR">
          {options?.wrapper ? React.createElement(options.wrapper, null, children) : children}
        </CurrencyContext.Provider>
      </LocaleContext.Provider>
    </NextIntlClientProvider>
  );
  const result = testingLibraryRender(wrap(ui));
  return {...result, rerender: (nextUi: ReactNode) => result.rerender(wrap(nextUi))};
}
