import {DEFAULT_PREFERENCES} from './constants';

export type EffectivePreferences = {
  language: 'en_US' | 'de_DE';
  currency: 'EUR' | 'USD';
  timeZone: 'Europe/Berlin';
};

export function normalizePreferences(
  preferences: {language: string; currency: string; timeZone: string} | null | undefined,
): EffectivePreferences {
  return {
    language: preferences?.language === 'de_DE' ? 'de_DE' : DEFAULT_PREFERENCES.language,
    currency: preferences?.currency === 'USD' ? 'USD' : DEFAULT_PREFERENCES.currency,
    timeZone: DEFAULT_PREFERENCES.timeZone,
  };
}

export function getPreferenceLocale(preferences: EffectivePreferences): 'en-US' | 'de-DE' {
  return preferences.language === 'de_DE' ? 'de-DE' : 'en-US';
}
