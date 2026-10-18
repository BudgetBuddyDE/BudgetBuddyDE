import {createTranslator} from 'next-intl';
import {DEFAULT_LOCALE, getMessageKey} from './config';

export type AppTranslationValues = Record<string, string | number>;
export type AppTranslator = (source: string, values?: AppTranslationValues) => string;

type SourceTranslator = {
  (key: string, values?: AppTranslationValues): string;
  has: (key: string) => boolean;
};

export function createAppTranslator(translator: SourceTranslator): AppTranslator {
  return (source, values) => {
    const key = getMessageKey(source);
    if (translator.has(key)) return translator(key, values);

    // New English-source calls work before the generated catalog is refreshed.
    return createTranslator({locale: DEFAULT_LOCALE, messages: {[key]: source}})(key, values);
  };
}
