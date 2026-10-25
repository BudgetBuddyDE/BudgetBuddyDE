export const DEFAULT_LOCALE = 'en-US';
export const SUPPORTED_LOCALES = ['en-US', 'de-DE'] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export function normalizeLocale(locale: string | null | undefined): SupportedLocale {
  if (!locale) return DEFAULT_LOCALE;

  try {
    const normalized = Intl.getCanonicalLocales(locale.replace('_', '-'))[0];
    return SUPPORTED_LOCALES.includes(normalized as SupportedLocale) ? (normalized as SupportedLocale) : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

export function toPreferenceLanguage(locale: string | null | undefined): 'en_US' | 'de_DE' {
  return normalizeLocale(locale) === 'de-DE' ? 'de_DE' : 'en_US';
}
