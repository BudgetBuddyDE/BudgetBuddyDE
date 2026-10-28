import {describe, expect, it} from 'vite-plus/test';
import {DEFAULT_LOCALE, normalizeLocale, resolveLocale, SUPPORTED_LOCALES, toPreferenceLanguage} from './config';

describe('locale configuration', () => {
  it('normalizes the stored preference locale for Intl', () => {
    expect(normalizeLocale('en_US')).toBe('en-US');
    expect(normalizeLocale('de_DE')).toBe('de-DE');
  });

  it('normalizes German locale and maps it back to the stored preference format', () => {
    expect(toPreferenceLanguage('de-DE')).toBe('de_DE');
  });

  it('falls back to English for missing and unsupported locales', () => {
    expect(normalizeLocale(undefined)).toBe(DEFAULT_LOCALE);
    expect(normalizeLocale('not_a_locale')).toBe(DEFAULT_LOCALE);
    expect(toPreferenceLanguage('not_a_locale')).toBe('en_US');
  });

  it('has explicit entries for both supported locales', () => {
    expect(SUPPORTED_LOCALES).toEqual(['en-US', 'de-DE']);
  });

  it('prioritizes user preferences over cookie and browser language', () => {
    expect(resolveLocale({preferenceLanguage: 'de_DE', cookieLocale: 'en-US', acceptLanguage: 'en-US'})).toBe('de-DE');
    expect(resolveLocale({preferenceLanguage: 'fr_FR', cookieLocale: 'de-DE', acceptLanguage: 'de-DE'})).toBe(
      DEFAULT_LOCALE,
    );
  });

  it('uses the cookie when user preferences are unavailable', () => {
    expect(resolveLocale({cookieLocale: 'de-DE', acceptLanguage: 'en-US'})).toBe('de-DE');
    expect(resolveLocale({cookieLocale: 'fr-FR', acceptLanguage: 'de-DE'})).toBe(DEFAULT_LOCALE);
  });

  it('negotiates supported browser languages by quality and maps base languages', () => {
    expect(resolveLocale({acceptLanguage: 'fr-FR;q=1, de-AT;q=0.9, en-US;q=0.8'})).toBe('de-DE');
    expect(resolveLocale({acceptLanguage: 'de;q=1, en;q=0.5'})).toBe('de-DE');
    expect(resolveLocale({acceptLanguage: 'fr-FR, en-GB;q=0.9'})).toBe('en-US');
  });

  it('ignores excluded or malformed browser language entries', () => {
    expect(resolveLocale({acceptLanguage: 'de-DE;q=0, en-US;q=broken'})).toBe(DEFAULT_LOCALE);
    expect(resolveLocale({acceptLanguage: 'fr-FR, es-ES'})).toBe(DEFAULT_LOCALE);
  });

  it('uses the app default when every language source is missing', () => {
    expect(resolveLocale({})).toBe(DEFAULT_LOCALE);
  });
});
