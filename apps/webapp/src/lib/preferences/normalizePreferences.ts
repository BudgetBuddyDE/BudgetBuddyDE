import {DEFAULT_PREFERENCES} from './constants';

export type EffectivePreferences = {
  language: 'en_US';
  currency: 'EUR' | 'USD';
  timeZone: 'Europe/Berlin';
};

export function normalizePreferences(
  preferences: {language: string; currency: string; timeZone: string} | null | undefined,
): EffectivePreferences {
  return {
    language: DEFAULT_PREFERENCES.language,
    currency: preferences?.currency === 'USD' ? 'USD' : DEFAULT_PREFERENCES.currency,
    timeZone: DEFAULT_PREFERENCES.timeZone,
  };
}

export function getPreferenceLocale(_preferences: EffectivePreferences): 'en-US' {
  return 'en-US';
}
