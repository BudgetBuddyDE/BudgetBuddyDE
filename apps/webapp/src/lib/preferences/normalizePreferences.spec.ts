import {describe, expect, it} from 'vitest';
import {getPreferenceLocale, normalizePreferences} from './normalizePreferences';

describe('normalizePreferences', () => {
  it('provides stable defaults without preferences', () => {
    expect(normalizePreferences(null)).toEqual({language: 'en_US', currency: 'EUR', timeZone: 'Europe/Berlin'});
    expect(getPreferenceLocale(normalizePreferences(null))).toBe('en-US');
  });

  it('preserves supported currency and does not modify unsupported raw values', () => {
    const raw = {language: 'de_DE', currency: 'USD', timeZone: 'America/New_York'};
    expect(normalizePreferences(raw)).toEqual({language: 'de_DE', currency: 'USD', timeZone: 'Europe/Berlin'});
    expect(getPreferenceLocale(normalizePreferences(raw))).toBe('de-DE');
    expect(raw).toEqual({language: 'de_DE', currency: 'USD', timeZone: 'America/New_York'});
    expect(normalizePreferences({...raw, currency: 'GBP'}).currency).toBe('EUR');
  });

  it.each(['en_US', 'fr_FR', 'de-DE', '', 'DE_DE'])('falls back to English for %s', language => {
    const effective = normalizePreferences({language, currency: 'EUR', timeZone: 'Europe/Berlin'});
    expect(effective.language).toBe('en_US');
    expect(getPreferenceLocale(effective)).toBe('en-US');
  });
});
