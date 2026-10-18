import {DEFAULT_LOCALE, SUPPORTED_LOCALES, type AppLocale} from './config';

const LANGUAGE_PREFERENCE =
  /^[ \t]*(\*|[a-z]{1,8}(?:-[a-z0-9]{1,8})*)(?:[ \t]*;[ \t]*q[ \t]*=[ \t]*(0(?:\.\d{0,3})?|1(?:\.0{0,3})?|\.\d{1,3}))?[ \t]*$/i;

export function resolveBrowserLocale(acceptLanguage?: string | null): AppLocale {
  if (!acceptLanguage || acceptLanguage.length > 8192) return DEFAULT_LOCALE;

  const preferences = acceptLanguage.split(',').flatMap(entry => {
    const match = LANGUAGE_PREFERENCE.exec(entry);
    if (!match || match[0] !== entry) return [];
    return [{range: match[1].toLowerCase(), quality: match[2] === undefined ? 1 : Number(match[2])}];
  });
  const exclusions = preferences.filter(preference => preference.quality === 0);
  const specificity = (range: string) => (range === '*' ? 0 : range.split('-').length);

  // More specific positive ranges can override a broad exclusion, never an exact one.
  const isAllowed = (locale: AppLocale, range: string) =>
    !exclusions.some(
      exclusion =>
        (exclusion.range === '*' ||
          locale.toLowerCase() === exclusion.range ||
          locale.toLowerCase().startsWith(`${exclusion.range}-`)) &&
        (locale.toLowerCase() === exclusion.range || specificity(exclusion.range) >= specificity(range)),
    );

  // Modern JavaScript sorting is stable, preserving header order for equal weights.
  for (const {range} of preferences
    .filter(preference => preference.quality > 0)
    .sort((a, b) => b.quality - a.quality)) {
    if (range === '*') {
      const locale = ([DEFAULT_LOCALE, ...SUPPORTED_LOCALES] as const).find(supported => isAllowed(supported, range));
      if (locale) return locale;
      continue;
    }

    const exact = SUPPORTED_LOCALES.find(supported => supported.toLowerCase() === range);
    if (exact && isAllowed(exact, range)) return exact;
    const language = range.split('-')[0];
    const fallback = SUPPORTED_LOCALES.find(
      supported => supported.toLowerCase().split('-')[0] === language && isAllowed(supported, range),
    );
    if (fallback) return fallback;
  }

  return DEFAULT_LOCALE;
}
