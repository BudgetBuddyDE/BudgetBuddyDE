export const DEFAULT_LOCALE = 'en-US';
export const SUPPORTED_LOCALES = [DEFAULT_LOCALE] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export function resolveAppLocale(language?: string | null): AppLocale {
  const locale = language?.replaceAll('_', '-');
  return SUPPORTED_LOCALES.find(supported => supported === locale) ?? DEFAULT_LOCALE;
}

// Encode every code point, avoiding next-intl's dots and collisions with literal source text.
export function getMessageKey(source: string): string {
  return `m_${Array.from(source, character => character.codePointAt(0)!.toString(16)).join('_')}`;
}

export function getMessageSource(key: string): string {
  if (!/^m_(?:[0-9a-f]+(?:_[0-9a-f]+)*)?$/.test(key)) throw new Error(`Invalid message key: ${key}`);
  const source =
    key === 'm_'
      ? ''
      : key
          .slice(2)
          .split('_')
          .map(code => String.fromCodePoint(parseInt(code, 16)))
          .join('');
  if (getMessageKey(source) !== key) throw new Error(`Noncanonical message key: ${key}`);
  return source;
}
