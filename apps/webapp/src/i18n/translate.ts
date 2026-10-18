import {createTranslator} from 'next-intl';
import {DEFAULT_LOCALE} from './config';
import {englishMessages, type AppMessages, type AppTranslationKey} from './messages';

export type AppTranslationValues = Record<string, string | number | Date>;
export type AppTranslator = <K extends AppTranslationKey>(key: K, values?: AppTranslationValues) => string;

type NextTranslator = ((key: string, values?: AppTranslationValues) => string) & {has: (key: never) => boolean};

export function createAppTranslator(translator: NextTranslator): AppTranslator {
  const format = translator as unknown as (key: string, values?: AppTranslationValues) => string;
  return ((key: AppTranslationKey, values?: AppTranslationValues) => {
    if (!translator.has(key as never)) throw new Error(`Unknown translation key: ${key}`);
    return format(key, values);
  }) as AppTranslator;
}

export const englishTranslator: AppTranslator = createAppTranslator(
  createTranslator({
    locale: DEFAULT_LOCALE,
    messages: englishMessages as AppMessages,
    timeZone: 'UTC',
  }) as unknown as NextTranslator,
);
