export interface Preferences {
  locale: 'en-US' | 'de-DE';
  currency: 'EUR' | 'USD' | 'GBP';
  timeZone: string;
}

export const defaultPreferences: Preferences = {locale: 'en-US', currency: 'EUR', timeZone: 'Europe/Berlin'};
let activePreferences = defaultPreferences;

export function getActivePreferences(): Preferences {
  return activePreferences;
}

export function setActivePreferences(preferences: Preferences): void {
  activePreferences = preferences;
}
