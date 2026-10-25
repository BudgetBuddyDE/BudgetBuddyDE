import {describe, expect, it} from 'vite-plus/test';
import {DEFAULT_LOCALE, normalizeLocale, SUPPORTED_LOCALES} from './config';

describe('locale configuration', () => {
  it('normalizes the stored preference locale for Intl', () => {
    expect(normalizeLocale('en_US')).toBe('en-US');
  });

  it('falls back to English for missing and unsupported locales', () => {
    expect(normalizeLocale(undefined)).toBe(DEFAULT_LOCALE);
    expect(normalizeLocale('de_DE')).toBe(DEFAULT_LOCALE);
    expect(normalizeLocale('not_a_locale')).toBe(DEFAULT_LOCALE);
  });

  it('has a single explicit initial locale in the allowlist', () => {
    expect(SUPPORTED_LOCALES).toEqual(['en-US']);
  });
});
