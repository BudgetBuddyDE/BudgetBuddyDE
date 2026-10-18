export const DEFAULT_LOCALE = 'en-US';
export const SUPPORTED_LOCALES = [DEFAULT_LOCALE, 'de-DE'] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export function resolveAppLocale(language?: string | null): AppLocale {
  const locale = language?.replaceAll('_', '-');
  return SUPPORTED_LOCALES.find(supported => supported === locale) ?? DEFAULT_LOCALE;
}
