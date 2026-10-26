export const DEFAULT_LOCALE = 'en-US';
export const SUPPORTED_LOCALES = ['en-US', 'de-DE'] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export function parseSupportedLocale(locale: string | null | undefined): SupportedLocale | undefined {
  if (!locale) return undefined;

  try {
    const normalized = Intl.getCanonicalLocales(locale.replace('_', '-'))[0];
    return SUPPORTED_LOCALES.includes(normalized as SupportedLocale) ? (normalized as SupportedLocale) : undefined;
  } catch {
    return undefined;
  }
}

export function normalizeLocale(locale: string | null | undefined): SupportedLocale {
  return parseSupportedLocale(locale) ?? DEFAULT_LOCALE;
}

function localeForBrowserLanguage(language: string): SupportedLocale | undefined {
  const exact = parseSupportedLocale(language);
  if (exact) return exact;

  const baseLanguage = language.split('-')[0]?.toLowerCase();
  if (baseLanguage === 'de') return 'de-DE';
  if (baseLanguage === 'en') return 'en-US';
  return undefined;
}

function negotiateBrowserLocale(acceptLanguage: string | null | undefined): SupportedLocale | undefined {
  if (!acceptLanguage) return undefined;

  const candidates = acceptLanguage
    .split(',')
    .map((entry, index) => {
      const [language, ...parameters] = entry.trim().split(';');
      const qualityParameter = parameters.find(parameter => parameter.trim().startsWith('q='));
      const quality = qualityParameter ? Number(qualityParameter.trim().slice(2)) : 1;
      return {language: language?.trim(), quality, index};
    })
    .filter(
      (candidate): candidate is {language: string; quality: number; index: number} =>
        Boolean(candidate.language) &&
        Number.isFinite(candidate.quality) &&
        candidate.quality > 0 &&
        candidate.quality <= 1,
    )
    .sort((left, right) => right.quality - left.quality || left.index - right.index);

  for (const {language} of candidates) {
    const locale = localeForBrowserLanguage(language);
    if (locale) return locale;
  }

  return undefined;
}

export function resolveLocale({
  preferenceLanguage,
  cookieLocale,
  acceptLanguage,
}: {
  preferenceLanguage?: string | null;
  cookieLocale?: string | null;
  acceptLanguage?: string | null;
}): SupportedLocale {
  if (preferenceLanguage != null) return normalizeLocale(preferenceLanguage);
  if (cookieLocale != null) return normalizeLocale(cookieLocale);
  return negotiateBrowserLocale(acceptLanguage) ?? DEFAULT_LOCALE;
}

export function toPreferenceLanguage(locale: string | null | undefined): 'en_US' | 'de_DE' {
  return normalizeLocale(locale) === 'de-DE' ? 'de_DE' : 'en_US';
}
