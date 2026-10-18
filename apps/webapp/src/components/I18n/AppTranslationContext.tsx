'use client';

import {createTranslator} from 'next-intl';
import {createContext} from 'react';
import {DEFAULT_LOCALE} from '@/lib/i18n/config';
import {englishMessages} from '@/lib/i18n/messages';
import {createAppTranslator} from '@/lib/i18n/translate';

export const AppTranslationContext = createContext(
  createAppTranslator(createTranslator({locale: DEFAULT_LOCALE, messages: englishMessages, timeZone: 'UTC'})),
);
