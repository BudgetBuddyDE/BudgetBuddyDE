import {describe, expect, it} from 'vite-plus/test';
import {DEFAULT_LOCALE, normalizeLocale, SUPPORTED_LOCALES, toPreferenceLanguage} from './config';

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
});
